import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Header, Footer } from "@/components/Chrome";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import QuickAssignDialog from "@/components/QuickAssignDialog";
import { supabase } from "@/integrations/supabase/client";
import { FormState, getDeadlines, INCIDENT_TYPE_LABELS, SECTOR_LABELS, DPA_MAP } from "@/lib/aegis";
import { exportIncidentToPdf } from "@/lib/pdfExport";

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

// WCAG-aware risk colours: AA-compliant on white when used as text. We keep the
// vivid hue for the badge background and rely on bold uppercase labels for non-color cues.
const RISK_COLORS: Record<string, string> = {
  critical: "#b91c1c",
  high: "#c2410c",
  medium: "#a16207",
  low: "#15803d",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#b91c1c",
  in_review: "#a16207",
  closed: "#15803d",
};

function fmtCountdown(deadlineMs: number): { text: string; color: string; urgency: "overdue" | "critical" | "urgent" | "ok" } {
  const now = Date.now();
  const diff = deadlineMs - now;
  if (diff <= 0) return { text: "OVERDUE", color: "#b91c1c", urgency: "overdue" };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h < 4) return { text: `${h}h ${m}m`, color: "#b91c1c", urgency: "critical" };
  if (h < 24) return { text: `${h}h ${m}m`, color: "#c2410c", urgency: "urgent" };
  return { text: `${h}h ${m}m`, color: "#475569", urgency: "ok" };
}

const Dashboard = () => {
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [completionsByInc, setCompletionsByInc] = useState<Record<string, number>>({});
  const [oversightByInc, setOversightByInc] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (incidentId: string) => {
    setExporting(incidentId);
    try {
      const [{ data: inc }, { data: roles }, { data: audit }, { data: notifs }, { data: pre }] = await Promise.all([
        supabase.from("incidents").select("*").eq("id", incidentId).maybeSingle(),
        supabase.from("incident_roles").select("role, staff_name, staff_email, assigned_at").eq("incident_id", incidentId).order("assigned_at"),
        supabase.from("audit_logs").select("message, created_at").eq("incident_id", incidentId).order("created_at"),
        supabase.from("notifications").select("framework, subject, status, body").eq("incident_id", incidentId),
        supabase.from("pre_intakes").select("*").eq("incident_id", incidentId).maybeSingle(),
      ]);
      if (!inc) { toast.error("Incident not found."); setExporting(null); return; }
      const incAny = inc as Record<string, unknown>;
      exportIncidentToPdf({
        incidentId,
        isoReference: incAny.iso_reference as string | null,
        severity: incAny.severity_classification as string | null,
        reporterLiteracy: incAny.reporter_literacy as string | null,
        techEscalationState: incAny.tech_escalation_state as string | null,
        legalEscalationState: incAny.legal_escalation_state as string | null,
        discoveryTime: incAny.discovery_time as string | null,
        formData: (incAny.form_data ?? {}) as FormState,
        riskRating: incAny.risk_rating as string | null,
        status: incAny.status as string | null,
        aiAssessment: (incAny.ai_assessment ?? null) as Record<string, unknown> | null,
        firedAlerts: (incAny.fired_alerts ?? []) as { title: string; cite: string }[],
        auditLog: (audit ?? []) as { message: string; created_at: string }[],
        notifications: (notifs ?? []) as { framework: string; subject: string; status: string; body?: string }[],
        roles: (roles ?? []) as { role: string; staff_name: string; staff_email?: string | null; assigned_at: string }[],
        preIntake: (pre ?? null) as Parameters<typeof exportIncidentToPdf>[0]["preIntake"],
      });
    } catch (e) {
      console.error(e);
      toast.error("Export failed.");
    } finally {
      setExporting(null);
    }
  };

  // WCAG 2.4.2 — descriptive page title.
  useEffect(() => {
    document.title = "Incident dashboard — Aegis Notice";
    return () => { document.title = "Aegis Notice — EU Data Breach Response"; };
  }, []);

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
    <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>
      <a href="#main" className="skip-to-main">Skip to main content</a>
      <Header />
      <main id="main" className="flex-1" style={{ padding: "32px" }} aria-labelledby="dashboard-heading">
        <div className="mx-auto" style={{ maxWidth: 1400 }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
              Incident Operations
            </p>
            <h2 id="dashboard-heading" style={{ color: "#0f172a", fontSize: 28, fontWeight: 400, letterSpacing: "0.05em", margin: 0 }}>
              All incidents — regulatory countdown
            </h2>
            <p style={{ color: "#475569", fontSize: 14, marginTop: 8 }}>
              Live triage view across GDPR, NIS2, DORA and CER deadlines. Refreshes every 30s.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}><LegalDisclaimer compact /></div>

          {loading ? (
            <div role="status" aria-live="polite" style={{ color: "#475569", padding: 40, textAlign: "center" }}>Loading incidents…</div>
          ) : rows.length === 0 ? (
            <div style={{ color: "#475569", padding: 40, textAlign: "center", border: "1px dashed #94a3b8" }}>
              No incidents yet. <Link to="/" style={{ color: "#1a56db", textDecoration: "underline" }}>Start a new pre-intake →</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #94a3b8", background: "#ffffff" }} role="region" aria-label="Incident list">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#0f172a" }}>
                <caption className="sr-only">All recorded incidents with their regulatory deadlines, outstanding actions, oversight requests and status.</caption>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    {["Discovered", "Type", "Sector", "DPA", "Affected", "Risk", "Active deadlines", "Outstanding", "Completed", "Oversight", "Status", "Actions"].map(h => (
                      <th key={h} scope="col" style={{ padding: "12px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", fontWeight: 600 }}>
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
                      <tr key={r.id} style={{ borderTop: "1px solid #e2e8f0" }}>
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
                          <span
                            role="status"
                            aria-label={`Risk rating: ${r.risk_rating || "not assessed"}`}
                            style={{
                              background: RISK_COLORS[r.risk_rating || "low"] || "#475569",
                              color: "#fff", padding: "3px 8px", fontSize: 11, fontWeight: 700,
                              letterSpacing: "0.1em", textTransform: "uppercase",
                            }}
                          >
                            {r.risk_rating || "n/a"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {deadlines.length === 0 && <span style={{ color: "#475569" }}>none</span>}
                            {deadlines.slice(0, 3).map((d, i) => {
                              const cd = fmtCountdown(discoveredMs + d.hours * 3_600_000);
                              return (
                                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <span
                                    aria-label={`${d.framework}, urgency ${cd.urgency}, ${cd.text}`}
                                    style={{ color: cd.color, fontWeight: 700, minWidth: 70, fontVariantNumeric: "tabular-nums" }}
                                  >
                                    {cd.text}
                                  </span>
                                  <span style={{ color: "#475569", fontSize: 12 }}>{d.framework}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {(() => {
                            const c = r.outstanding_actions_count ?? 0;
                            const color = c === 0 ? "#15803d" : c >= 5 ? "#b91c1c" : c >= 2 ? "#c2410c" : "#a16207";
                            const label = c === 0 ? "No outstanding actions" : `${c} outstanding action${c === 1 ? "" : "s"}`;
                            return (
                              <span
                                aria-label={label}
                                style={{
                                  display: "inline-block",
                                  minWidth: 28,
                                  textAlign: "center",
                                  background: c === 0 ? "#dcfce7" : "#fff5f5",
                                  color,
                                  border: `1px solid ${color}`,
                                  padding: "3px 8px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                <span aria-hidden="true">{c === 0 ? "✓" : c}</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {(() => {
                            const cnt = completionsByInc[r.id] ?? 0;
                            return (
                              <span
                                aria-label={`${cnt} action${cnt === 1 ? "" : "s"} completed by responders`}
                                style={{
                                  display: "inline-block", minWidth: 28, textAlign: "center",
                                  background: cnt > 0 ? "#dcfce7" : "transparent",
                                  color: cnt > 0 ? "#15803d" : "#475569",
                                  border: `1px solid ${cnt > 0 ? "#15803d" : "#94a3b8"}`,
                                  padding: "3px 8px", fontSize: 12, fontWeight: 700,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                                title="Actions completed by responders (audit feedback)"
                              >
                                <span aria-hidden="true">{cnt > 0 ? `✓ ${cnt}` : "0"}</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {(() => {
                            const cnt = oversightByInc[r.id] ?? 0;
                            if (cnt === 0) return <span style={{ color: "#475569", fontSize: 12 }} aria-label="No pending oversight requests">—</span>;
                            return (
                              <span
                                aria-label={`${cnt} pending oversight request${cnt === 1 ? "" : "s"}`}
                                style={{
                                  display: "inline-block", minWidth: 28, textAlign: "center",
                                  background: "#dbeafe", color: "#1e3a8a",
                                  border: "1px solid #1e40af",
                                  padding: "3px 8px", fontSize: 12, fontWeight: 700,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                                title="Pending oversight requests on this incident"
                              >
                                <span aria-hidden="true">⚑</span> {cnt}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <label className="sr-only" htmlFor={`status-${r.id}`}>Status for incident {r.id.slice(0, 8)}</label>
                          <select
                            id={`status-${r.id}`}
                            value={r.status}
                            onChange={(e) => updateStatus(r.id, e.target.value)}
                            style={{
                              background: "#ffffff",
                              color: STATUS_COLORS[r.status] || "#0f172a",
                              border: `1px solid ${STATUS_COLORS[r.status] || "#94a3b8"}`,
                              padding: "4px 8px", fontSize: 12, fontWeight: 600,
                            }}
                          >
                            <option value="open">Open</option>
                            <option value="in_review">In review</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                            <Link
                              to={`/incident/${r.id}`}
                              style={{ color: "#1a56db", fontSize: 12, textDecoration: "underline", fontWeight: 600 }}
                              aria-label={`Open incident ${r.id.slice(0, 8)}`}
                            >
                              Open →
                            </Link>
                            <button
                              type="button"
                              onClick={() => setAssignFor(r.id)}
                              aria-label={`Assign staff to incident ${r.id.slice(0, 8)}`}
                              style={{
                                background: "transparent", color: "#1a56db",
                                border: "1px solid #1a56db", padding: "3px 8px",
                                borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: "pointer",
                              }}
                            >
                              Assign staff
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExport(r.id)}
                              disabled={exporting === r.id}
                              aria-label={`Export incident ${r.id.slice(0, 8)} as PDF`}
                              style={{
                                background: "transparent", color: "#15803d",
                                border: "1px solid #15803d", padding: "3px 8px",
                                borderRadius: 3, fontSize: 11, fontWeight: 600,
                                cursor: exporting === r.id ? "wait" : "pointer",
                                opacity: exporting === r.id ? 0.6 : 1,
                              }}
                            >
                              {exporting === r.id ? "Exporting…" : "Export PDF"}
                            </button>
                          </div>
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
      <QuickAssignDialog
        incidentId={assignFor ?? ""}
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
      />
    </div>
  );
};

export default Dashboard;
