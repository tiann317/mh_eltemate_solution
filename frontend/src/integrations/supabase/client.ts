/**
 * Lightweight Supabase-compatible shim that talks to the local FastAPI
 * backend (`backend/`) instead of Supabase. Lets every existing call site
 * keep its `.from(table).select(...).eq(...)...` shape unchanged.
 *
 * Backend base URL comes from `VITE_API_BASE_URL` (defaults to
 * `http://localhost:8000`). Set it in `.env`.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

type Filters = Record<string, unknown>;

interface ApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

async function api<T = unknown>(path: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: { message: `HTTP ${res.status}: ${text.slice(0, 200)}` } };
    }
    const json = await res.json();
    return { data: (json as { data?: T }).data ?? (json as T), error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Network error" } };
  }
}

class QueryBuilder<TRow = Record<string, unknown>> implements PromiseLike<ApiResponse<TRow[]>> {
  private filters: Filters = {};
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private singleMode: "none" | "single" | "maybeSingle" = "none";

  constructor(
    private readonly table: string,
    private readonly mode: "select" | "delete",
    private readonly _columns?: string,
  ) {}

  eq(col: string, val: unknown) {
    this.filters[col] = val;
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.singleMode = "single";
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  private async run(): Promise<ApiResponse<TRow[] | TRow | null>> {
    if (this.mode === "delete") {
      const r = await api<{ deleted: number }>(`/api/db/${this.table}/delete`, { filters: this.filters });
      return { data: null, error: r.error };
    }
    const r = await api<TRow[]>(`/api/db/${this.table}/select`, {
      filters: this.filters,
      order_by: this.orderCol,
      ascending: this.orderAsc,
      limit: this.limitN,
    });
    if (r.error) return r as ApiResponse<TRow[]>;
    const rows = (r.data ?? []) as TRow[];
    if (this.singleMode === "single") {
      if (rows.length === 0) return { data: null, error: { message: "No rows" } };
      return { data: rows[0], error: null };
    }
    if (this.singleMode === "maybeSingle") {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }

  then<TResult1 = ApiResponse<TRow[]>, TResult2 = never>(
    onfulfilled?: ((value: ApiResponse<TRow[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled as never, onrejected);
  }
}

class MutationBuilder<TRow = Record<string, unknown>> implements PromiseLike<ApiResponse<TRow[] | TRow | null>> {
  private filters: Filters = {};
  private singleMode: "none" | "single" | "maybeSingle" = "none";
  private columns: string | null = null;

  constructor(
    private readonly table: string,
    private readonly mode: "insert" | "update",
    private readonly payload: unknown,
  ) {}

  eq(col: string, val: unknown) {
    this.filters[col] = val;
    return this;
  }
  select(cols?: string) {
    this.columns = cols ?? "*";
    return this;
  }
  single() {
    this.singleMode = "single";
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  private async run(): Promise<ApiResponse<TRow[] | TRow | null>> {
    if (this.mode === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const r = await api<TRow[]>(`/api/db/${this.table}/insert`, { rows });
      if (r.error) return r as ApiResponse<TRow[]>;
      const out = (r.data ?? []) as TRow[];
      if (this.singleMode === "single") return { data: out[0] ?? null, error: out[0] ? null : { message: "No rows" } };
      if (this.singleMode === "maybeSingle") return { data: out[0] ?? null, error: null };
      return { data: out, error: null };
    }
    // update
    const r = await api<TRow[]>(`/api/db/${this.table}/update`, {
      filters: this.filters,
      patch: this.payload,
    });
    if (r.error) return r as ApiResponse<TRow[]>;
    const out = (r.data ?? []) as TRow[];
    if (this.singleMode === "single") return { data: out[0] ?? null, error: out[0] ? null : { message: "No rows" } };
    if (this.singleMode === "maybeSingle") return { data: out[0] ?? null, error: null };
    return { data: out, error: null };
  }

  then<TResult1 = ApiResponse<TRow[] | TRow | null>, TResult2 = never>(
    onfulfilled?: ((value: ApiResponse<TRow[] | TRow | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled as never, onrejected);
  }
}

class TableHandle<TRow = Record<string, unknown>> {
  constructor(private readonly table: string) {}
  select(cols?: string) {
    return new QueryBuilder<TRow>(this.table, "select", cols);
  }
  insert(rows: unknown) {
    return new MutationBuilder<TRow>(this.table, "insert", rows);
  }
  update(patch: unknown) {
    return new MutationBuilder<TRow>(this.table, "update", patch);
  }
  delete() {
    return new QueryBuilder<TRow>(this.table, "delete");
  }
}

const FUNCTION_PATHS: Record<string, string> = {
  "assess-breach": "/api/assess-breach",
  "query-lda": "/api/query-lda",
  "escalate-incident": "/api/escalate-incident",
};

export const supabase = {
  from<TRow = Record<string, unknown>>(table: string) {
    return new TableHandle<TRow>(table);
  },
  functions: {
    async invoke(name: string, opts?: { body?: unknown }) {
      const path = FUNCTION_PATHS[name];
      if (!path) return { data: null, error: { message: `Unknown function: ${name}` } };
      const r = await api(path, opts?.body ?? {});
      // The endpoints return their full JSON object directly; api() puts it in .data.
      return r;
    },
  },
};
