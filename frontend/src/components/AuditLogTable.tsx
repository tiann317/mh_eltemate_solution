import { classifyAuditMessage, splitTimestamp, AuditSource } from "@/lib/auditClassify";

export interface AuditLogRow { id: string; message: string; created_at: string }

const SOURCE_COLORS: Record<AuditSource, { bg: string; fg: string }> = {
  "user-form":        { bg: "rgba(99,175,240,0.15)",  fg: "#1a56db" },
  "rules-engine":     { bg: "rgba(168,85,247,0.15)",  fg: "#7c3aed" },
  "lda-legal-db":     { bg: "rgba(82,214,138,0.15)",  fg: "#15803d" },
  "ai-gateway":       { bg: "rgba(255,196,107,0.18)", fg: "#b45309" },
  "database":         { bg: "rgba(100,116,139,0.18)", fg: "#334155" },
  "responder-action": { bg: "rgba(239,68,68,0.12)",   fg: "#b91c1c" },
  "system":           { bg: "rgba(15,23,42,0.08)",    fg: "#475569" },
};

interface Props { logs: AuditLogRow[] }

export default function AuditLogTable({ logs }: Props) {
  if (!logs.length) {
    return (
      <div style={{ color: "#64748b", fontSize: 12, padding: 12, border: "1px solid rgba(15,23,42,0.08)", background: "#f8fafc" }}>
        No audit entries recorded for this incident.
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid rgba(15,23,42,0.1)", background: "#fff", overflow: "hidden" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "150px 130px 130px 1fr 220px",
        background: "#f1f5f9", color: "#475569",
        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600,
      }}>
        <div style={{ padding: "8px 10px" }}>Timestamp</div>
        <div style={{ padding: "8px 10px" }}>Source</div>
        <div style={{ padding: "8px 10px" }}>ISO 27035 stage</div>
        <div style={{ padding: "8px 10px" }}>Event</div>
        <div style={{ padding: "8px 10px" }}>ISO 27001 / 27002 control</div>
      </div>
      <div style={{ maxHeight: 420, overflowY: "auto" }}>
        {logs.map((row) => {
          const { ts, body } = splitTimestamp(row.message);
          const cls = classifyAuditMessage(body);
          const c = SOURCE_COLORS[cls.source];
          return (
            <div key={row.id} style={{
              display: "grid",
              gridTemplateColumns: "150px 130px 130px 1fr 220px",
              borderTop: "1px solid rgba(15,23,42,0.06)",
              fontSize: 11, color: "#1e293b", lineHeight: 1.5,
            }}>
              <div style={{ padding: "8px 10px", fontFamily: "ui-monospace, monospace", color: "#475569" }}>
                {ts || new Date(row.created_at).toISOString().replace("T", " ").slice(0, 19) + " UTC"}
              </div>
              <div style={{ padding: "8px 10px" }}>
                <span style={{
                  background: c.bg, color: c.fg, fontSize: 10, padding: "2px 6px",
                  fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap",
                }}>
                  {cls.sourceLabel}
                </span>
              </div>
              <div style={{ padding: "8px 10px", color: "#475569" }}>{cls.categoryLabel}</div>
              <div style={{ padding: "8px 10px" }}>{body}</div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ color: "#1a56db", fontWeight: 600, fontSize: 10 }}>{cls.isoControl}</div>
                <div style={{ color: "#64748b", fontSize: 10, fontStyle: "italic" }}>{cls.isoControlTitle}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        padding: "8px 12px", borderTop: "1px solid rgba(15,23,42,0.08)",
        background: "#f8fafc", color: "#64748b", fontSize: 10, lineHeight: 1.5,
      }}>
        Each row identifies the originating <strong>data source</strong> (system of record) and the anchoring control under
        ISO/IEC 27001:2022, ISO/IEC 27002:2022, ISO/IEC 27005:2022, ISO/IEC 27035-1:2023 and ISO/IEC 27037 — supporting
        the auditability requirement under ISO/IEC 27001 Clause 9.1 (monitoring, measurement, analysis &amp; evaluation)
        and Annex A control A.5.28 (collection of evidence).
      </div>
    </div>
  );
}
