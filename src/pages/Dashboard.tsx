import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "@/components/Chrome";
import { supabase } from "@/integrations/supabase/client";
import { FormState, getDeadlines, INCIDENT_TYPE_LABELS, SECTOR_LABELS, DPA_MAP } from "@/lib/aegis";

interface IncidentRow {
  id: string;
  discovery_time: string | null;
  incident_type: string | null;
  sector: string | null;
  jurisdiction: string | null;
  num_affected: string | null;
  risk_rating: string | null;
  status: string;
  form_data: FormState;
  outstanding_actions_count: number | null;
  created_at: string;
}

const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#ef4444",
  in_review: "#eab308",
  closed: "#22c55e",
};

function fmtCountdown(deadlineMs: number): { text: string; color: string } {
  const now = Date.now();
  const diff = deadlineMs - now;
  if (diff <= 0) return { text: "OVERDUE", color: "#ef4444" };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const color = h < 4 ? "#ef4444" : h < 24 ? "#f97316" : "#a8bbd4";
  return { text: `${h}h ${m}m`, color };
}

const Dashboard = () => {
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [completionsByInc, setCompletionsByInc] = useState<Record<string, number>>({});
  const [oversightByInc, setOversightByInc] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data, error }, { data: comps }, { data: ovs }] = await Promise.all([
        supabase
          .from("incidents")
          .select("id, discovery_time, incident_type, sector, jurisdiction, num_affected, risk_rating, status, form_data, outstanding_actions_count, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("action_completions").select("incident_id"),
        supabase.from("oversight_requests").select("incident_id, status"),
      ]);
      if (!error && data) setRows(data as unknown as IncidentRow[]);
      const cMap: Record<string, number> = {};
      (comps ?? []).forEach((c: { incident_id: string }) => { cMap[c.incident_id] = (cMap[c.incident_id] ?? 0) + 1; });
      setCompletionsByInc(cMap);
      const oMap: Record<string, number> = {};
      (ovs ?? []).forEach((o: { incident_id: string; status: string }) => {
        if (o.status === "pending") oMap[o.incident_id] = (oMap[o.incident_id] ?? 0) + 1;
      });
      setOversightByInc(oMap);
      setLoading(false);
    })();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("incidents").update({ status }).eq("id", id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0a1525" }}>
      <Header />
      <main className="flex-1" style={{ padding: "32px" }}>
        <div className="mx-auto" style={{ maxWidth: 1400 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: "#63AFF0", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Incident Operations
            </div>
            <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 300, letterSpacing: "0.05em", margin: 0 }}>
              All incidents — regulatory countdown
            </h2>
            <div style={{ color: "#a8bbd4", fontSize: 13, marginTop: 8 }}>
              Live triage view across GDPR, NIS2, DORA and CER deadlines. Refreshes every 30s.
            </div>
          </div>

          {loading ? (
            <div style={{ color: "#a8bbd4", padding: 40, textAlign: "center" }}>Loading incidents…</div>
          ) : rows.length === 0 ? (
            <div style={{ color: "#a8bbd4", padding: 40, textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)" }}>
              No incidents yet. <Link to="/" style={{ color: "#63AFF0" }}>Submit a new incident →</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", background: "#0d1b2e" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#e2e8f0" }}>
                <thead>
                  <tr style={{ background: "#13243d", textAlign: "left" }}>
                    {["Discovered", "Type", "Sector", "DPA", "Affected", "Risk", "Active deadlines", "Outstanding", "Completed", "Oversight", "Status", ""].map(h => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a8bbd4", fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const discoveredMs = r.discovery_time ? new Date(r.discovery_time).getTime() : new Date(r.created_at).getTime();
                    const deadlines = getDeadlines(r.form_data).filter(d => d.applies);
                    void now;
                    return (
                      <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <td style={{ padding: "12px 14px" }}>
                          {r.discovery_time || new Date(r.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {r.incident_type ? INCIDENT_TYPE_LABELS[r.incident_type as keyof typeof INCIDENT_TYPE_LABELS] : "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {r.sector ? SECTOR_LABELS[r.sector as keyof typeof SECTOR_LABELS] : "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {r.jurisdiction ? DPA_MAP[r.jurisdiction as keyof typeof DPA_MAP] : "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>{r.num_affected || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            background: RISK_COLORS[r.risk_rating || "low"] || "#475569",
                            color: "#fff", padding: "3px 8px", fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.1em", textTransform: "uppercase",
                          }}>
                            {r.risk_rating || "n/a"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {deadlines.length === 0 && <span style={{ color: "#64748b" }}>none</span>}
                            {deadlines.slice(0, 3).map((d, i) => {
                              const cd = fmtCountdown(discoveredMs + d.hours * 3_600_000);
                              return (
                                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <span style={{ color: cd.color, fontWeight: 700, minWidth: 70, fontVariantNumeric: "tabular-nums" }}>
                                    {cd.text}
                                  </span>
                                  <span style={{ color: "#a8bbd4", fontSize: 11 }}>{d.framework}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {(() => {
                            const c = r.outstanding_actions_count ?? 0;
                            const color = c === 0 ? "#52D68A" : c >= 5 ? "#ef4444" : c >= 2 ? "#f97316" : "#eab308";
                            return (
                              <span style={{
                                display: "inline-block",
                                minWidth: 28,
                                textAlign: "center",
                                background: c === 0 ? "rgba(82,214,138,0.15)" : "rgba(0,0,0,0.3)",
                                color,
                                border: `1px solid ${color}`,
                                padding: "3px 8px",
                                fontSize: 11,
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                              }}>{c === 0 ? "✓" : c}</span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {(() => {
                            const cnt = completionsByInc[r.id] ?? 0;
                            return (
                              <span style={{
                                display: "inline-block", minWidth: 28, textAlign: "center",
                                background: cnt > 0 ? "#dcfce7" : "transparent",
                                color: cnt > 0 ? "#166534" : "#94a3b8",
                                border: `1px solid ${cnt > 0 ? "#22c55e" : "#cbd5e1"}`,
                                padding: "3px 8px", fontSize: 11, fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                              }} title="Actions completed by responders (audit feedback)">
                                {cnt > 0 ? `✓ ${cnt}` : "0"}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {(() => {
                            const cnt = oversightByInc[r.id] ?? 0;
                            if (cnt === 0) return <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>;
                            return (
                              <span style={{
                                display: "inline-block", minWidth: 28, textAlign: "center",
                                background: "#dbeafe", color: "#1e40af",
                                border: "1px solid #3b82f6",
                                padding: "3px 8px", fontSize: 11, fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                              }} title="Pending oversight requests on this incident">
                                ⚑ {cnt}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <select
                            value={r.status}
                            onChange={(e) => updateStatus(r.id, e.target.value)}
                            style={{
                              background: "#0d1b2e",
                              color: STATUS_COLORS[r.status] || "#fff",
                              border: `1px solid ${STATUS_COLORS[r.status] || "#475569"}`,
                              padding: "4px 8px", fontSize: 11, fontWeight: 600,
                            }}
                          >
                            <option value="open">Open</option>
                            <option value="in_review">In review</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <Link to={`/incident/${r.id}`} style={{ color: "#63AFF0", fontSize: 11, textDecoration: "none" }}>
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
