// Minimal localStorage-backed shim that mimics the subset of the supabase-js
// API used by this app. No network, no auth — everything is local to the
// browser. Edge-function calls (assess-breach, query-lda) are dispatched to
// the LDA Legal Data Hub directly using hardcoded hackathon credentials.

import { runEdgeFunction } from "./edgeFunctions";

type Row = Record<string, unknown> & { id?: string };

const STORAGE_KEY = "aegis-local-db-v1";
const isBrowser = typeof window !== "undefined";

function loadDb(): Record<string, Row[]> {
  if (!isBrowser) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDb(db: Record<string, Row[]>): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* quota or disabled storage */
  }
}

function getTable(name: string): Row[] {
  const db = loadDb();
  if (!db[name]) db[name] = [];
  return db[name];
}

function setTable(name: string, rows: Row[]): void {
  const db = loadDb();
  db[name] = rows;
  saveDb(db);
}

function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

interface Filter {
  column: string;
  value: unknown;
}

class QueryBuilder {
  private filters: Filter[] = [];
  private orderColumn: string | null = null;
  private orderAsc = true;

  constructor(
    private table: string,
    private operation: "select" | "insert" | "update" | "delete",
    private payload: unknown = null,
  ) {}

  eq(column: string, value: unknown): this {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderColumn = column;
    this.orderAsc = options?.ascending !== false;
    return this;
  }

  select(_columns?: string): this {
    return this;
  }

  private matches(row: Row): boolean {
    return this.filters.every((f) => row[f.column] === f.value);
  }

  private run(): { data: Row[]; error: null } {
    let rows = getTable(this.table);

    if (this.operation === "insert") {
      const inserts = Array.isArray(this.payload)
        ? (this.payload as Row[])
        : [this.payload as Row];
      const stamped = inserts.map((r) => ({
        id: r.id ?? newId(),
        created_at: r.created_at ?? nowIso(),
        ...r,
      }));
      rows = [...rows, ...stamped];
      setTable(this.table, rows);
      return { data: stamped, error: null };
    }

    if (this.operation === "update") {
      const next = rows.map((r) =>
        this.matches(r) ? { ...r, ...(this.payload as Row) } : r,
      );
      setTable(this.table, next);
      const updated = next.filter((r) => this.matches(r));
      return { data: updated, error: null };
    }

    if (this.operation === "delete") {
      const remaining = rows.filter((r) => !this.matches(r));
      setTable(this.table, remaining);
      return { data: [], error: null };
    }

    let result = rows.filter((r) => this.matches(r));
    if (this.orderColumn) {
      const col = this.orderColumn;
      result = [...result].sort((a, b) => {
        const av = a[col] as string | number | undefined;
        const bv = b[col] as string | number | undefined;
        if (av === bv) return 0;
        if (av === undefined) return 1;
        if (bv === undefined) return -1;
        return (av < bv ? -1 : 1) * (this.orderAsc ? 1 : -1);
      });
    }
    return { data: result, error: null };
  }

  maybeSingle(): Promise<{ data: Row | null; error: null }> {
    const { data } = this.run();
    return Promise.resolve({ data: data[0] ?? null, error: null });
  }

  single(): Promise<{ data: Row | null; error: null }> {
    return this.maybeSingle();
  }

  then<TResult1 = { data: Row[]; error: null }, TResult2 = never>(
    onFulfilled?: (value: { data: Row[]; error: null }) => TResult1 | PromiseLike<TResult1>,
    onRejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onFulfilled, onRejected);
  }
}

class TableClient {
  constructor(private table: string) {}

  select(columns?: string): QueryBuilder {
    return new QueryBuilder(this.table, "select").select(columns);
  }

  insert(payload: Row | Row[]): QueryBuilder {
    return new QueryBuilder(this.table, "insert", payload);
  }

  update(payload: Row): QueryBuilder {
    return new QueryBuilder(this.table, "update", payload);
  }

  delete(): QueryBuilder {
    return new QueryBuilder(this.table, "delete");
  }
}

export const supabase = {
  from(table: string): TableClient {
    return new TableClient(table);
  },
  functions: {
    invoke(name: string, init: { body: unknown }): Promise<{ data: unknown; error: unknown }> {
      return runEdgeFunction(name, init.body);
    },
  },
  auth: {
    getUser(): Promise<{ data: { user: null }; error: null }> {
      return Promise.resolve({ data: { user: null }, error: null });
    },
  },
};
