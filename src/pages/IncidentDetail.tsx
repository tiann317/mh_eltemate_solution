import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header, Footer } from "@/components/Chrome";
import { supabase } from "@/integrations/supabase/client";
import {
  AIAssessment, FormState, getDeadlines, normalizeAction,
  INCIDENT_TYPE_LABELS, SECTOR_LABELS, DPA_MAP, DATA_CATEGORY_LABELS,
  computeOutstanding, buildPrioritizedPlan,
} from "@/lib/aegis";
import NotificationsPanel, { NotificationRow } from "@/components/NotificationsPanel";
import OutstandingActions from "@/components/OutstandingActions";
import PrioritizedActionPlan from "@/components/PrioritizedActionPlan";

interface IncidentRecord {
  id: string;
  discovery_time: string | null;
  incident_type: string | null;
  sector: string | null;
  jurisdiction: string | null;
  risk_rating: string | null;
  status: string;
  form_data: FormState;
  fired_alerts: { title: string; cite: string }[];
  ai_assessment: AIAssessment | null;
  lda_gdpr: { sources?: unknown[] } | null;
  lda_nis2: { sources?: unknown[] } | null;
  lda_dora: { sources?: unknown[] } | null;
  created_at: string;
}

interface AuditLogRow { id: string; message: string; created_at: string; }

const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e",
};

function countdown(deadlineMs: number) {
  const diff = deadlineMs - Date.now();
  if (diff <= 0) return { text: "OVERDUE", color: "#ef4444", overdue: true };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const color = h < 4 ? "#ef4444" : h < 24 ? "#f97316" : h < 48 ? "#eab308" : "#22c55e";
  return { text: `${h}h ${m}m remaining`, color, overdue: false };
}

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ color: "#63AFF0", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
      {label}
    </div>
    {children}
  </div>
);

const IncidentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [inc, setInc] = useState<IncidentRecord | null>(null);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: incData }, { data: logData }] = await Promise.all([
        supabase.from("incidents").select("*").eq("id", id).maybeSingle(),
        supabase.from("audit_logs").select("id, message, created_at").eq("incident_id", id).order("created_at", { ascending: true }),
      ]);
      if (incData) setInc(incData as unknown as IncidentRecord);
      if (logData) setLogs(logData as AuditLogRow[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#0a1525" }}>
        <Header />
        <main className="flex-1" style={{ padding: 40, color: "#a8bbd4", textAlign: "center" }}>Loading…</main>
        <Footer />
      </div>
    );
  }
  if (!inc) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#0a1525" }}>
        <Header />
        <main className="flex-1" style={{ padding: 40, color: "#a8bbd4", textAlign: "center" }}>
          Incident not found. <Link to="/dashboard" style={{ color: "#63AFF0" }}>Back to dashboard</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const discoveredMs = inc.discovery_time ? new Date(inc.discovery_time).getTime() : new Date(inc.created_at).getTime();
  const deadlines = getDeadlines(inc.form_data).filter(d => d.applies);
  const ai = inc.ai_assessment;
  const playbook = ai?.security_playbook ?? [];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0a1525" }}>
      <Header />
      <main className="flex-1" style={{ padding: "32px" }}>
        <div className="mx-auto" style={{ maxWidth: 1200, color: "#e2e8f0" }}>
          <Link to="/dashboard" style={{ color: "#63AFF0", fontSize: 11, textDecoration: "none" }}>← All incidents</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 300, letterSpacing: "0.05em", margin: 0 }}>
              Incident {inc.id.slice(0, 8)}
            </h2>
            <span style={{
              background: RISK_COLORS[inc.risk_rating || "low"] || "#475569",
              color: "#fff", padding: "4px 10px", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase",
            }}>
              {inc.risk_rating || "n/a"} risk
            </span>
            <span style={{ color: "#a8bbd4", fontSize: 12 }}>
              {inc.incident_type ? INCIDENT_TYPE_LABELS[inc.incident_type as keyof typeof INCIDENT_TYPE_LABELS] : "—"}
              {" · "}
              {inc.sector ? SECTOR_LABELS[inc.sector as keyof typeof SECTOR_LABELS] : "—"}
              {" · "}
              {inc.jurisdiction ? DPA_MAP[inc.jurisdiction as keyof typeof DPA_MAP] : "—"}
            </span>
          </div>
          <div style={{ color: "#a8bbd4", fontSize: 12, marginTop: 8 }}>
            Discovered: {inc.discovery_time || new Date(inc.created_at).toLocaleString()}
          </div>

          {(() => {
            const totalSources =
              (inc.lda_gdpr?.sources?.length ?? 0) +
              (inc.lda_nis2?.sources?.length ?? 0) +
              (inc.lda_dora?.sources?.length ?? 0);
            if (totalSources > 0) {
              return (
                <div style={{
                  marginTop: 16, padding: "10px 14px",
                  border: "1px solid rgba(82,214,138,0.4)", background: "rgba(82,214,138,0.08)",
                  color: "#52D68A", fontSize: 12, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>✓</span>
                  <span>
                    Assessment enriched with <strong>{totalSources}</strong> cited source{totalSources === 1 ? "" : "s"} from the LDA legal database.
                  </span>
                </div>
              );
            }
            return (
              <div style={{
                marginTop: 16, padding: "10px 14px",
                border: "1px solid rgba(255,196,107,0.5)", background: "rgba(255,196,107,0.08)",
                color: "#ffc46b", fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span style={{ lineHeight: "18px" }}>⚠</span>
                <span style={{ color: "#e2e8f0", lineHeight: 1.6 }}>
                  <strong style={{ color: "#ffc46b" }}>LDA legal database not connected.</strong>{" "}
                  This assessment was generated <strong>without cited legal sources</strong> — statutory references below are model-generated and should be verified by counsel.
                  Configure the <code>LDA</code> backend secret to enable sourced guidance on future incidents.
                </span>
              </div>
            );
          })()}

          {(() => {
            const outstanding = computeOutstanding(
              inc.form_data,
              discoveredMs,
              notifications.map(n => ({ framework: n.framework, status: n.status })),
              ai?.lawyer_packet?.decisions_needed ?? [],
            );
            const sentCount = notifications.filter(n => n.status === "sent").length;
            return (
              <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="lg:grid-cols-2">
                <div>
                  <div style={{ color: "#63AFF0", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                    Outstanding actions ({outstanding.length})
                  </div>
                  <OutstandingActions actions={outstanding} />
                </div>
                <div>
                  <div style={{ color: "#63AFF0", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                    Notifications status
                  </div>
                  <div style={{ padding: "10px 12px", border: "1px solid rgba(255,255,255,0.08)", background: "#0d1b2e", color: "#e2e8f0", fontSize: 12, lineHeight: 1.7 }}>
                    <div><strong style={{ color: "#52D68A" }}>{sentCount}</strong> sent · <strong style={{ color: "#ffc46b" }}>{notifications.length - sentCount}</strong> draft{notifications.length - sentCount === 1 ? "" : "s"} pending</div>
                    {notifications.length === 0 && <div style={{ color: "#64748b" }}>No statutory notifications generated.</div>}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Prioritized action plan with persistence + oversight */}
          {(() => {
            const plan = buildPrioritizedPlan(
              inc.form_data,
              ai,
              discoveredMs,
              notifications.map(n => ({ framework: n.framework, status: n.status })),
            );
            return (
              <div style={{ marginTop: 32 }}>
                <div style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
                  Prioritized action plan
                </div>
                <div style={{ color: "#475569", fontSize: 12, marginBottom: 12 }}>
                  Ordered by urgency &amp; statutory severity. Mark items as done or request additional oversight from Legal / DPO / external counsel — every action is captured in the audit log for lawyer review.
                </div>
                <PrioritizedActionPlan incidentId={inc.id} actions={plan} />
              </div>
            );
          })()}

          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="lg:grid-cols-2">
            {/* LEFT */}
            <div>
              <Section label="Active regulatory clocks">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {deadlines.length === 0 && <div style={{ color: "#64748b", fontSize: 12 }}>No regulatory clocks active.</div>}
                  {deadlines.map((d, i) => {
                    const cd = countdown(discoveredMs + d.hours * 3_600_000);
                    return (
                      <div key={i} style={{
                        border: `1px solid ${cd.color}`, padding: "12px 14px",
                        background: "rgba(0,0,0,0.2)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{d.framework}</div>
                            <div style={{ color: "#a8bbd4", fontSize: 11 }}>{d.label}</div>
                          </div>
                          <div style={{ color: cd.color, fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                            {cd.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section label="Security playbook — measures to take now">
                <div style={{ color: "#a8bbd4", fontSize: 11, marginBottom: 10 }}>
                  Concrete defensive controls the form submitter MUST implement to maintain legal & risk compliance. Each measure is anchored to a statutory provision.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {playbook.length === 0 && (
                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      No security playbook generated yet. Re-run assessment with updated AI prompt.
                    </div>
                  )}
                  {playbook.map((m, i) => (
                    <div key={i} style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "12px 14px", background: "#0d1b2e" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{
                          background: m.priority === "P0" ? "#ef4444" : m.priority === "P1" ? "#f97316" : "#475569",
                          color: "#fff", fontSize: 9, padding: "2px 6px", fontWeight: 700, letterSpacing: "0.1em",
                        }}>{m.priority || "P2"}</span>
                        <span style={{
                          background: "rgba(99,175,240,0.15)", color: "#63AFF0", fontSize: 10,
                          padding: "2px 6px", fontWeight: 600,
                        }}>{m.legal_basis}</span>
                      </div>
                      <div style={{ color: "#fff", fontSize: 13, marginBottom: 4 }}>{m.measure}</div>
                      <div style={{ color: "#a8bbd4", fontSize: 11, fontStyle: "italic" }}>{m.rationale}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section label="Recommended technical actions (with legal anchor)">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(ai?.recommended_actions ?? []).map((raw, i) => {
                    const a = normalizeAction(raw);
                    return (
                      <div key={i} style={{ border: "1px solid rgba(255,255,255,0.08)", padding: 10, background: "#0d1b2e" }}>
                        <div style={{ color: "#fff", fontSize: 13 }}>{a.action}</div>
                        <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{
                            background: "rgba(82,214,138,0.15)", color: "#52D68A", fontSize: 10,
                            padding: "2px 6px", fontWeight: 600,
                          }}>{a.legal_basis}</span>
                          <span style={{ color: "#a8bbd4", fontSize: 11 }}>{a.rationale}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </div>

            {/* RIGHT */}
            <div>
              <Section label="Risk assessment">
                <div style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.08)", padding: 14, color: "#e2e8f0", fontSize: 13, lineHeight: 1.6 }}>
                  {ai?.risk_assessment || "No AI assessment available."}
                </div>
              </Section>

              <Section label="Incident snapshot">
                <table style={{ width: "100%", fontSize: 12, color: "#e2e8f0", borderCollapse: "collapse" }}>
                  <tbody>
                    {[
                      ["Data categories", inc.form_data.dataCategories.map(c => DATA_CATEGORY_LABELS[c]).join(", ") || "—"],
                      ["Affected", inc.form_data.numAffected || "—"],
                      ["Systems", inc.form_data.systemsAffected || "—"],
                      ["Controller", inc.form_data.controllerName || "—"],
                      ["DPO", inc.form_data.dpoContact || "—"],
                      ["Cross-border", inc.form_data.crossBorder || "—"],
                      ["Outside counsel", inc.form_data.outsideCounsel || "—"],
                    ].map(([k, v], i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <td style={{ padding: "6px 8px", color: "#a8bbd4", width: 160 }}>{k}</td>
                        <td style={{ padding: "6px 8px" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section label="Outstanding decisions (lawyer packet)">
                <ul style={{ margin: 0, paddingLeft: 18, color: "#e2e8f0", fontSize: 12, lineHeight: 1.7 }}>
                  {(ai?.lawyer_packet?.decisions_needed ?? []).map((d, i) => <li key={i}>{d}</li>)}
                  {(ai?.lawyer_packet?.open_questions ?? []).map((q, i) => <li key={`q${i}`} style={{ color: "#a8bbd4" }}>{q}</li>)}
                  {!ai?.lawyer_packet && <li style={{ color: "#64748b" }}>No lawyer packet generated.</li>}
                </ul>
              </Section>

              <Section label="Statutory notifications — review, send, track">
                <NotificationsPanel
                  incidentId={inc.id}
                  onChange={async (rows) => {
                    setNotifications(rows);
                    // Recompute outstanding count and persist on the incident row.
                    const outstanding = computeOutstanding(
                      inc.form_data,
                      discoveredMs,
                      rows.map(n => ({ framework: n.framework, status: n.status })),
                      ai?.lawyer_packet?.decisions_needed ?? [],
                    );
                    await supabase.from("incidents").update({ outstanding_actions_count: outstanding.length }).eq("id", inc.id);
                  }}
                />
              </Section>

              <Section label="Audit log">
                <div style={{
                  background: "#000", border: "1px solid rgba(255,255,255,0.08)", padding: 14,
                  fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#9bb6d6",
                  maxHeight: 320, overflowY: "auto", whiteSpace: "pre-wrap",
                }}>
                  {logs.map(l => l.message).join("\n") || "No logs."}
                </div>
              </Section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IncidentDetail;
