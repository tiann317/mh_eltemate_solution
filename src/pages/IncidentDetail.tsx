import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header, Footer } from "@/components/Chrome";
import { supabase } from "@/integrations/supabase/client";
import {
  AIAssessment, FormState, getDeadlines, normalizeAction,
  INCIDENT_TYPE_LABELS, SECTOR_LABELS, DPA_MAP, DATA_CATEGORY_LABELS,
  computeOutstanding, buildPrioritizedPlan,
  GENERAL_AUDITABILITY_ACTIONS, getIncidentTypeTechnicalActions,
} from "@/lib/aegis";
import NotificationsPanel, { NotificationRow } from "@/components/NotificationsPanel";
import OutstandingActions from "@/components/OutstandingActions";
import PrioritizedActionPlan from "@/components/PrioritizedActionPlan";
import AuditLogTable from "@/components/AuditLogTable";
import LawyerFeedbackLoop from "@/components/LawyerFeedbackLoop";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import EscalationDiagram from "@/components/EscalationDiagram";
import StaffRolesPanel from "@/components/StaffRolesPanel";
import { exportIncidentToPdf } from "@/lib/pdfExport";

// WCAG 2.1 AA palette adjustments — text colors below meet >= 4.5:1 on white.
// success #15803d ≈ 5.4:1, warning #b45309 ≈ 5.0:1, muted #475569 ≈ 7.0:1.
const A11Y_SUCCESS = "#15803d";
const A11Y_WARNING = "#b45309";
const A11Y_MUTED = "#475569";
const A11Y_BORDER = "#cbd5e1"; // 1.6:1 — only used for non-essential UI grouping where 1.4.11 still allows; component boundaries that ARE essential use #94a3b8.

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
  severity_classification: string | null;
  reporter_pre_intake_id: string | null;
  reporter_literacy: string | null;
  tech_escalation_state: string | null;
  legal_escalation_state: string | null;
  iso_reference: string | null;
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

const Section = ({ label, children, headingLevel = 3 }: { label: string; children: React.ReactNode; headingLevel?: 2 | 3 | 4 }) => {
  const Tag = (`h${headingLevel}` as unknown) as keyof JSX.IntrinsicElements;
  return (
    <section style={{ marginBottom: 28 }} aria-labelledby={`sec-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      <Tag
        id={`sec-${label.replace(/\s+/g, "-").toLowerCase()}`}
        style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, margin: "0 0 10px 0", fontWeight: 600 }}
      >
        {label}
      </Tag>
      {children}
    </section>
  );
};

const IncidentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [inc, setInc] = useState<IncidentRecord | null>(null);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  // WCAG 2.4.2 — set a descriptive page title for each incident.
  useEffect(() => {
    if (inc) {
      document.title = `Incident ${inc.id.slice(0, 8)} — ${inc.risk_rating ?? "unrated"} risk · Aegis Notice`;
    } else {
      document.title = "Incident — Aegis Notice";
    }
    return () => { document.title = "Aegis Notice — EU Data Breach Response"; };
  }, [inc]);

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
      <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>
        <Header />
        <main id="main" className="flex-1" style={{ padding: 40, color: A11Y_MUTED, textAlign: "center" }} aria-busy="true" aria-live="polite">
          Loading incident…
        </main>
        <Footer />
      </div>
    );
  }
  if (!inc) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>
        <Header />
        <main id="main" className="flex-1" style={{ padding: 40, color: A11Y_MUTED, textAlign: "center" }}>
          Incident not found. <Link to="/dashboard" style={{ color: "#1a56db" }}>Back to dashboard</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const discoveredMs = inc.discovery_time ? new Date(inc.discovery_time).getTime() : new Date(inc.created_at).getTime();
  const deadlines = getDeadlines(inc.form_data).filter(d => d.applies);
  const ai = inc.ai_assessment;
  const playbook = ai?.security_playbook ?? [];
  const riskLabel = inc.risk_rating || "unrated";

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>
      {/* WCAG 2.4.1 — bypass blocks */}
      <a href="#main" className="skip-to-main">Skip to main content</a>
      <Header />
      <main id="main" className="flex-1" style={{ padding: "32px" }} aria-labelledby="incident-heading">
        <div className="mx-auto" style={{ maxWidth: 1200, color: "#0f172a" }}>
          <Link to="/dashboard" style={{ color: "#1a56db", fontSize: 12, textDecoration: "underline" }} aria-label="Back to all incidents">← All incidents</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            <h2 id="incident-heading" style={{ color: "#0f172a", fontSize: 24, fontWeight: 400, letterSpacing: "0.05em", margin: 0 }}>
              Incident {inc.id.slice(0, 8)}
            </h2>
            <span
              role="status"
              aria-label={`Risk rating: ${riskLabel}`}
              style={{
                background: RISK_COLORS[inc.risk_rating || "low"] || "#475569",
                color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
              }}
            >
              {riskLabel} risk
            </span>
            <span
              role="status"
              aria-label={`Severity classification: ${inc.severity_classification ?? "suspected"}`}
              style={{
                background: inc.severity_classification === "definite" ? "#fee2e2" : "#fef3c7",
                color: inc.severity_classification === "definite" ? "#7f1d1d" : "#78350f",
                border: `1px solid ${inc.severity_classification === "definite" ? "#b91c1c" : "#b45309"}`,
                padding: "4px 10px", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
              }}
            >
              {inc.severity_classification === "definite" ? "Definite" : "Suspected"}
            </span>
            <span style={{ color: A11Y_MUTED, fontSize: 13 }}>
              {inc.incident_type ? INCIDENT_TYPE_LABELS[inc.incident_type as keyof typeof INCIDENT_TYPE_LABELS] : "—"}
              {" · "}
              {inc.sector ? SECTOR_LABELS[inc.sector as keyof typeof SECTOR_LABELS] : "—"}
              {" · "}
              {inc.jurisdiction ? DPA_MAP[inc.jurisdiction as keyof typeof DPA_MAP] : "—"}
            </span>
          </div>
          <div style={{ color: A11Y_MUTED, fontSize: 13, marginTop: 8 }}>
            Discovered: {inc.discovery_time || new Date(inc.created_at).toLocaleString()}
            {inc.iso_reference && <span style={{ marginLeft: 12 }}>· ISO ref: <strong>{inc.iso_reference}</strong></span>}
          </div>

          {/* Persistent legal disclaimer (WCAG-compliant). */}
          <div style={{ marginTop: 16 }}><LegalDisclaimer /></div>

          {/* Export to PDF (ISO 27035-aligned). */}
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={async () => {
                const [{ data: roles }, { data: notif }, { data: pre }] = await Promise.all([
                  supabase.from("incident_roles").select("role, staff_name, staff_email, assigned_at").eq("incident_id", inc.id),
                  supabase.from("notifications").select("framework, subject, status, body").eq("incident_id", inc.id),
                  inc.reporter_pre_intake_id
                    ? supabase.from("pre_intakes").select("*").eq("id", inc.reporter_pre_intake_id).maybeSingle()
                    : Promise.resolve({ data: null }),
                ]);
                exportIncidentToPdf({
                  incidentId: inc.id,
                  isoReference: inc.iso_reference,
                  severity: inc.severity_classification,
                  reporterLiteracy: inc.reporter_literacy,
                  techEscalationState: inc.tech_escalation_state,
                  legalEscalationState: inc.legal_escalation_state,
                  discoveryTime: inc.discovery_time,
                  formData: inc.form_data,
                  riskRating: inc.risk_rating,
                  status: inc.status,
                  aiAssessment: inc.ai_assessment as unknown as Record<string, unknown> | null,
                  firedAlerts: inc.fired_alerts ?? [],
                  auditLog: logs.map(l => ({ message: l.message, created_at: l.created_at })),
                  notifications: (notif ?? []) as { framework: string; subject: string; status: string; body?: string }[],
                  roles: (roles ?? []) as { role: string; staff_name: string; staff_email: string | null; assigned_at: string }[],
                  preIntake: pre as ConstructorParameters<typeof Object>[0] as Parameters<typeof exportIncidentToPdf>[0]["preIntake"],
                });
              }}
              style={{
                background: "#0f172a", color: "#ffffff", border: "none",
                padding: "10px 18px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Export full incident to PDF (ISO 27035-aligned)
            </button>
          </div>

          {/* Escalation diagram — both tracks visible. */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
              Where this incident sits
            </h3>
            <EscalationDiagram
              techState={inc.tech_escalation_state ?? "not_started"}
              legalState={inc.legal_escalation_state ?? "not_started"}
              onTechChange={async (k) => {
                await supabase.from("incidents").update({ tech_escalation_state: k }).eq("id", inc.id);
                await supabase.from("audit_logs").insert([{ incident_id: inc.id, message: `Tech escalation → ${k}` }]);
                setInc({ ...inc, tech_escalation_state: k });
              }}
              onLegalChange={async (k) => {
                await supabase.from("incidents").update({ legal_escalation_state: k }).eq("id", inc.id);
                await supabase.from("audit_logs").insert([{ incident_id: inc.id, message: `Legal escalation → ${k}` }]);
                setInc({ ...inc, legal_escalation_state: k });
              }}
            />
          </div>

          {/* Allocated & reporting staff (audit). */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
              Allocated &amp; reporting staff
            </h3>
            <StaffRolesPanel incidentId={inc.id} />
          </div>


          {(() => {
            const totalSources =
              (inc.lda_gdpr?.sources?.length ?? 0) +
              (inc.lda_nis2?.sources?.length ?? 0) +
              (inc.lda_dora?.sources?.length ?? 0);
            if (totalSources > 0) {
              return (
                <div
                  role="status"
                  style={{
                    marginTop: 16, padding: "10px 14px",
                    border: `1px solid ${A11Y_SUCCESS}`, background: "#f0fdf4",
                    color: A11Y_SUCCESS, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <span aria-hidden="true">✓</span>
                  <span>
                    Assessment enriched with <strong>{totalSources}</strong> cited source{totalSources === 1 ? "" : "s"} from the LDA legal database.
                  </span>
                </div>
              );
            }
            return (
              <div
                role="status"
                style={{
                  marginTop: 16, padding: "10px 14px",
                  border: `1px solid ${A11Y_WARNING}`, background: "#fffbeb",
                  fontSize: 13, display: "flex", alignItems: "flex-start", gap: 8,
                }}
              >
                <span aria-hidden="true" style={{ lineHeight: "18px", color: A11Y_WARNING }}>⚠</span>
                <span style={{ color: "#0f172a", lineHeight: 1.6 }}>
                  <strong style={{ color: A11Y_WARNING }}>LDA legal database not connected.</strong>{" "}
                  This assessment was generated <strong>without cited legal sources</strong> — statutory references below are model-generated and should be verified by counsel.
                  Configure the <code>LDA</code> backend secret to enable sourced guidance on future incidents.
                </span>
              </div>
            );
          })()}

          {/* IMMEDIATE TECHNICAL ACTIONS — surfaced upfront so responders see them
              the moment the incident page loads, before scrolling. Each item carries
              its statutory anchor for auditable execution. */}
          {(() => {
            const actions = (ai?.recommended_actions ?? []).map(normalizeAction);
            if (!actions.length) return null;
            return (
              <section
                role="alert"
                aria-labelledby="act-now-heading"
                style={{
                  marginTop: 24,
                  border: "2px solid #b91c1c",
                  background: "#fff5f5",
                  padding: "16px 18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <span aria-hidden="true" style={{
                    background: "#b91c1c", color: "#fff", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.15em", padding: "3px 8px",
                  }}>ACT NOW</span>
                  <h3 id="act-now-heading" style={{ margin: 0, fontSize: 15, color: "#7f1d1d", fontWeight: 700 }}>
                    Immediate technical actions
                  </h3>
                  <span style={{ color: "#7f1d1d", fontSize: 13 }}>
                    {actions.length} step{actions.length === 1 ? "" : "s"} — execute now, every action is logged for audit
                  </span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 22, color: "#1e293b", fontSize: 14, lineHeight: 1.6 }}>
                  {actions.map((a, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>{a.action}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                        <span style={{
                          background: "#dcfce7", color: A11Y_SUCCESS, fontSize: 11,
                          padding: "2px 6px", fontWeight: 600, border: `1px solid ${A11Y_SUCCESS}`,
                        }}>{a.legal_basis}</span>
                        <span style={{ color: A11Y_MUTED, fontSize: 13, fontStyle: "italic" }}>{a.rationale}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })()}

          {/* IMMEDIATE TECHNICAL ACTION — two-track guidance:
                LEFT  = general audit-readiness measures (ISO 27001/27035/27037 + GDPR Art.5(2)).
                RIGHT = incident-type-specific containment, tailored to the classified type.
              Renders synchronously from incident metadata, so responders see it
              before the AI assessment returns. */}
          {(() => {
            const general = GENERAL_AUDITABILITY_ACTIONS;
            const specific = getIncidentTypeTechnicalActions(inc.form_data);
            const typeLabel = inc.form_data.incidentType
              ? INCIDENT_TYPE_LABELS[inc.form_data.incidentType]
              : "Unclassified incident";
            return (
              <div style={{ marginTop: 24 }}>
                <div style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
                  Immediate technical action
                </div>
                <div style={{ color: "#475569", fontSize: 12, marginBottom: 12 }}>
                  General audit-readiness steps apply to every incident. Incident-specific steps are tailored to the classified type and change materially per category — execute both tracks in parallel.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="lg:grid-cols-2">
                  <div style={{ border: "1px solid #cbd5e1", background: "#f8fafc", padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ background: "#1a56db", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", padding: "2px 6px" }}>GENERAL</span>
                      <h4 style={{ margin: 0, fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
                        Auditability — every incident
                      </h4>
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 20, color: "#1e293b", fontSize: 12, lineHeight: 1.55 }}>
                      {general.map((a, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>{a.action}</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                            <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #15803d", fontSize: 11, padding: "2px 5px", fontWeight: 600 }}>{a.legal_basis}</span>
                            <span style={{ color: "#475569", fontSize: 11, fontStyle: "italic" }}>{a.rationale}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div style={{ border: "1px solid #fca5a5", background: "#fff5f5", padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", padding: "2px 6px" }}>SPECIFIC</span>
                      <h4 style={{ margin: 0, fontSize: 13, color: "#7f1d1d", fontWeight: 600 }}>
                        {typeLabel}
                      </h4>
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 20, color: "#1e293b", fontSize: 12, lineHeight: 1.55 }}>
                      {specific.map((a, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>{a.action}</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                            <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #15803d", fontSize: 11, padding: "2px 5px", fontWeight: 600 }}>{a.legal_basis}</span>
                            <span style={{ color: "#475569", fontSize: 11, fontStyle: "italic" }}>{a.rationale}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
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
                  <div style={{ color: "#1a56db", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                    Outstanding actions ({outstanding.length})
                  </div>
                  <OutstandingActions actions={outstanding} />
                </div>
                <div>
                  <div style={{ color: "#1a56db", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                    Notifications status
                  </div>
                  <div style={{ padding: "10px 12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontSize: 12, lineHeight: 1.7 }}>
                    <div><strong style={{ color: "#15803d" }}>{sentCount}</strong> sent · <strong style={{ color: "#b45309" }}>{notifications.length - sentCount}</strong> draft{notifications.length - sentCount === 1 ? "" : "s"} pending</div>
                    {notifications.length === 0 && <div style={{ color: "#475569" }}>No statutory notifications generated.</div>}
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
                  {deadlines.length === 0 && <div style={{ color: "#475569", fontSize: 12 }}>No regulatory clocks active.</div>}
                  {deadlines.map((d, i) => {
                    const cd = countdown(discoveredMs + d.hours * 3_600_000);
                    // WCAG 1.4.1 — urgency conveyed by text label + symbol, not just color.
                    const urgencyLabel = cd.overdue ? "OVERDUE" : cd.color === "#ef4444" ? "Critical" : cd.color === "#f97316" ? "Urgent" : cd.color === "#eab308" ? "Approaching" : "On track";
                    return (
                      <div
                        key={i}
                        role="group"
                        aria-label={`${d.framework} regulatory clock: ${urgencyLabel}, ${cd.text}`}
                        style={{
                          border: `2px solid ${cd.color}`, padding: "12px 14px",
                          background: "#f8fafc",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div>
                            <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 600 }}>{d.framework}</div>
                            <div style={{ color: A11Y_MUTED, fontSize: 12 }}>{d.label}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: cd.color === "#22c55e" ? "#15803d" : cd.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {urgencyLabel}
                            </div>
                            <div style={{ color: "#0f172a", fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontSize: 13 }}>
                              {cd.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section label="Security playbook — measures to take now">
                <div style={{ color: "#475569", fontSize: 11, marginBottom: 10 }}>
                  Concrete defensive controls the form submitter MUST implement to maintain legal & risk compliance. Each measure is anchored to a statutory provision.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {playbook.length === 0 && (
                    <div style={{ color: "#475569", fontSize: 12 }}>
                      No security playbook generated yet. Re-run assessment with updated AI prompt.
                    </div>
                  )}
                  {playbook.map((m, i) => (
                    <div key={i} style={{ border: "1px solid #e2e8f0", padding: "12px 14px", background: "#f8fafc" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{
                          background: m.priority === "P0" ? "#ef4444" : m.priority === "P1" ? "#f97316" : "#475569",
                          color: "#fff", fontSize: 9, padding: "2px 6px", fontWeight: 700, letterSpacing: "0.1em",
                        }}>{m.priority || "P2"}</span>
                        <span style={{
                          background: "#dbeafe", color: "#1a56db", border: "1px solid #1a56db", fontSize: 11,
                          padding: "2px 6px", fontWeight: 600,
                        }}>{m.legal_basis}</span>
                      </div>
                      <div style={{ color: "#0f172a", fontSize: 13, marginBottom: 4 }}>{m.measure}</div>
                      <div style={{ color: "#475569", fontSize: 11, fontStyle: "italic" }}>{m.rationale}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section label="Recommended technical actions (with legal anchor)">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(ai?.recommended_actions ?? []).map((raw, i) => {
                    const a = normalizeAction(raw);
                    return (
                      <div key={i} style={{ border: "1px solid #e2e8f0", padding: 10, background: "#f8fafc" }}>
                        <div style={{ color: "#0f172a", fontSize: 13 }}>{a.action}</div>
                        <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{
                            background: "#dcfce7", color: "#15803d", border: "1px solid #15803d", fontSize: 10,
                            padding: "2px 6px", fontWeight: 600,
                          }}>{a.legal_basis}</span>
                          <span style={{ color: "#475569", fontSize: 11 }}>{a.rationale}</span>
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
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 14, color: "#0f172a", fontSize: 13, lineHeight: 1.6 }}>
                  {ai?.risk_assessment || "No AI assessment available."}
                </div>
              </Section>

              <Section label="Incident snapshot">
                <table style={{ width: "100%", fontSize: 13, color: "#0f172a", borderCollapse: "collapse" }}>
                  <caption className="sr-only">Incident metadata snapshot</caption>
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
                      <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <th scope="row" style={{ padding: "8px 10px", color: A11Y_MUTED, width: 180, textAlign: "left", fontWeight: 600 }}>{k}</th>
                        <td style={{ padding: "8px 10px" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section label="Outstanding decisions (lawyer packet)">
                <ul style={{ margin: 0, paddingLeft: 18, color: "#0f172a", fontSize: 12, lineHeight: 1.7 }}>
                  {(ai?.lawyer_packet?.decisions_needed ?? []).map((d, i) => <li key={i}>{d}</li>)}
                  {(ai?.lawyer_packet?.open_questions ?? []).map((q, i) => <li key={`q${i}`} style={{ color: "#475569" }}>{q}</li>)}
                  {!ai?.lawyer_packet && <li style={{ color: "#475569" }}>No lawyer packet generated.</li>}
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

            </div>
          </div>

          {/* SECOND FEEDBACK LOOP — Legal → Tech sub-incidents.
              After first review, counsel can dispatch follow-up technical
              actions, AI-compliance measures, and propose to upscale or
              downscale the AI's initial risk grading. */}
          <div style={{ marginTop: 32, padding: 16, border: "1px solid #ddd6fe", background: "#faf5ff" }}>
            <LawyerFeedbackLoop
              incidentId={inc.id}
              currentRisk={(inc.risk_rating as "low" | "medium" | "high" | "critical" | null) ?? null}
              onRiskChanged={(r) => setInc(prev => prev ? { ...prev, risk_rating: r } : prev)}
            />
          </div>

          <div style={{ marginTop: 32 }}>
            <div style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
              Incident audit log
            </div>
            <div style={{ color: "#475569", fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
              Every entry below is tagged with its <strong>data source</strong> (where the entry came from) and an
              anchoring <strong>ISO/IEC 27001 / 27002 / 27035 / 27037</strong> control reference, so external auditors can
              trace each event back to a system of record and a recognised business control objective.
            </div>
            <AuditLogTable logs={logs} />
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default IncidentDetail;
