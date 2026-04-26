import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Second feedback loop — Legal → Tech.
 *
 * After the first AI risk assessment + tech response, lawyers (or DPO /
 * external counsel) often need to send the technical team additional
 * recommended actions discovered during legal review:
 *   - new technical measures to take
 *   - specific AI-compliance steps (Art. 5 GDPR, EU AI Act Art. 14/15,
 *     ISO/IEC 42001 controls)
 *   - an upscale or downscale of the original AI risk grading,
 *     because legal context (cross-border transfers, sensitive categories,
 *     contractual obligations) materially changed the picture.
 *
 * Each lawyer-raised item is persisted as a `sub_incident` row tied to the
 * parent incident, written to the audit log, and — when applied — updates
 * the parent incident's risk_rating so the dashboard reflects the
 * lawyer-reviewed grading.
 */

const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
type Risk = typeof RISK_LEVELS[number];

const RISK_RANK: Record<Risk, number> = { low: 0, medium: 1, high: 2, critical: 3 };
const RISK_COLOR: Record<Risk, string> = {
  low: "#22c55e", medium: "#eab308", high: "#f97316", critical: "#ef4444",
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open:         { label: "OPEN — awaiting tech",       color: "#9a3412", bg: "#ffedd5" },
  acknowledged: { label: "ACK — tech in progress",     color: "#1e40af", bg: "#dbeafe" },
  completed:    { label: "COMPLETED",                  color: "#166534", bg: "#dcfce7" },
  rejected:     { label: "REJECTED",                   color: "#475569", bg: "#e2e8f0" },
};

interface SubIncident {
  id: string;
  parent_incident_id: string;
  raised_by_role: string;
  raised_by_name: string | null;
  recommended_action: string;
  ai_compliance_measures: string | null;
  risk_adjustment_direction: string;
  risk_from: string | null;
  risk_to: string | null;
  legal_basis: string | null;
  rationale: string | null;
  status: string;
  tech_response: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

interface Props {
  incidentId: string;
  currentRisk: Risk | null;
  onRiskChanged?: (newRisk: Risk) => void;
}

const LawyerFeedbackLoop = ({ incidentId, currentRisk, onRiskChanged }: Props) => {
  const [items, setItems] = useState<SubIncident[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // form state
  const [role, setRole] = useState("lawyer");
  const [name, setName] = useState("");
  const [action, setAction] = useState("");
  const [aiMeasures, setAiMeasures] = useState("");
  const [direction, setDirection] = useState<"none" | "upscale" | "downscale">("none");
  const [riskTo, setRiskTo] = useState<Risk>(currentRisk ?? "medium");
  const [legalBasis, setLegalBasis] = useState("");
  const [rationale, setRationale] = useState("");

  // tech response state, keyed by sub_incident id
  const [responseDraft, setResponseDraft] = useState<Record<string, string>>({});

  const refresh = async () => {
    const { data } = await supabase
      .from("sub_incidents")
      .select("*")
      .eq("parent_incident_id", incidentId)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as SubIncident[]);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [incidentId]);

  const reset = () => {
    setShowForm(false);
    setRole("lawyer"); setName(""); setAction(""); setAiMeasures("");
    setDirection("none"); setRiskTo(currentRisk ?? "medium");
    setLegalBasis(""); setRationale("");
  };

  const submit = async () => {
    if (!action.trim()) { toast.error("Recommended action is required"); return; }
    setBusy("create");

    const { error } = await supabase.from("sub_incidents").insert({
      parent_incident_id: incidentId,
      raised_by_role: role,
      raised_by_name: name || null,
      recommended_action: action,
      ai_compliance_measures: aiMeasures || null,
      risk_adjustment_direction: direction,
      risk_from: currentRisk,
      risk_to: direction === "none" ? null : riskTo,
      legal_basis: legalBasis || null,
      rationale: rationale || null,
    });

    if (error) { toast.error("Failed to send to tech"); setBusy(null); return; }

    await supabase.from("audit_logs").insert({
      incident_id: incidentId,
      message: `[${new Date().toISOString()}] Legal → Tech sub-incident raised by ${role}${name ? ` (${name})` : ""}: ${action}` +
        (direction !== "none" ? ` — risk grading proposal: ${direction.toUpperCase()} from ${currentRisk ?? "n/a"} → ${riskTo}` : "") +
        (legalBasis ? ` — basis ${legalBasis}` : ""),
    });

    toast.success("Sub-incident dispatched to technical team");
    reset();
    setBusy(null);
    refresh();
  };

  const acknowledge = async (s: SubIncident) => {
    setBusy(s.id);
    await supabase.from("sub_incidents").update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: "tech-operator",
    }).eq("id", s.id);
    await supabase.from("audit_logs").insert({
      incident_id: incidentId,
      message: `[${new Date().toISOString()}] Sub-incident acknowledged by technical team: ${s.recommended_action}`,
    });
    setBusy(null);
    refresh();
  };

  const complete = async (s: SubIncident) => {
    const note = responseDraft[s.id] ?? "";
    setBusy(s.id);
    await supabase.from("sub_incidents").update({
      status: "completed",
      tech_response: note || null,
      completed_at: new Date().toISOString(),
      completed_by: "tech-operator",
    }).eq("id", s.id);

    // Apply the lawyer-proposed risk adjustment to the parent incident.
    if (s.risk_adjustment_direction !== "none" && s.risk_to) {
      await supabase.from("incidents").update({ risk_rating: s.risk_to }).eq("id", incidentId);
      await supabase.from("audit_logs").insert({
        incident_id: incidentId,
        message: `[${new Date().toISOString()}] Risk grading ${s.risk_adjustment_direction.toUpperCase()} applied per legal review: ${s.risk_from ?? "n/a"} → ${s.risk_to} (sub-incident closed)`,
      });
      onRiskChanged?.(s.risk_to as Risk);
    }

    await supabase.from("audit_logs").insert({
      incident_id: incidentId,
      message: `[${new Date().toISOString()}] Sub-incident COMPLETED by tech: ${s.recommended_action}${note ? ` — response: ${note}` : ""}`,
    });
    setBusy(null);
    refresh();
  };

  const reject = async (s: SubIncident) => {
    const note = responseDraft[s.id] ?? "";
    setBusy(s.id);
    await supabase.from("sub_incidents").update({
      status: "rejected", tech_response: note || null,
    }).eq("id", s.id);
    await supabase.from("audit_logs").insert({
      incident_id: incidentId,
      message: `[${new Date().toISOString()}] Sub-incident REJECTED by tech: ${s.recommended_action}${note ? ` — reason: ${note}` : ""}`,
    });
    setBusy(null);
    refresh();
  };

  const counts = useMemo(() => ({
    open:    items.filter(i => i.status === "open").length,
    ack:     items.filter(i => i.status === "acknowledged").length,
    done:    items.filter(i => i.status === "completed").length,
    total:   items.length,
  }), [items]);

  const directionArrow = (dir: string) =>
    dir === "upscale" ? "▲" : dir === "downscale" ? "▼" : "→";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ color: "#7c3aed", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
            Legal → Tech feedback loop
          </div>
          <div style={{ color: "#475569", fontSize: 12, marginTop: 4, maxWidth: 720, lineHeight: 1.55 }}>
            After first review, internal counsel / DPO can dispatch <strong>sub-incidents</strong> to the technical team:
            new measures, AI-compliance steps (GDPR Art. 5, EU AI Act Art. 14/15, ISO/IEC 42001), and a proposal to
            <strong> upscale or downscale</strong> the AI's initial risk grading. Every dispatch is recorded in the
            audit log; completing a sub-incident with a risk adjustment updates the parent incident's grading.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, fontSize: 11, fontWeight: 600, flexWrap: "wrap" }}>
          {counts.open > 0 && <span style={{ padding: "4px 10px", background: "#ffedd5", color: "#9a3412", border: "1px solid #f97316" }}>{counts.open} open</span>}
          {counts.ack  > 0 && <span style={{ padding: "4px 10px", background: "#dbeafe", color: "#1e40af", border: "1px solid #3b82f6" }}>{counts.ack} in progress</span>}
          {counts.done > 0 && <span style={{ padding: "4px 10px", background: "#dcfce7", color: "#166534", border: "1px solid #22c55e" }}>{counts.done} completed</span>}
        </div>
      </div>

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            background: "#7c3aed", color: "#fff", border: "1px solid #7c3aed",
            padding: "8px 14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
            cursor: "pointer", marginBottom: 12,
          }}
        >+ Raise sub-incident to tech</button>
      )}

      {showForm && (
        <div style={{ border: "1px solid #c4b5fd", background: "#faf5ff", padding: 14, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Raised by (role)</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
                <option value="lawyer">Internal Legal Counsel</option>
                <option value="dpo">Data Protection Officer</option>
                <option value="external-counsel">External counsel</option>
                <option value="ciso">CISO (legal-track input)</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Name (for audit record)</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="e.g. M. Dupont" />
            </div>
          </div>

          <label style={lbl}>Recommended action for tech *</label>
          <textarea
            value={action} onChange={e => setAction(e.target.value)} rows={2}
            style={{ ...inp, resize: "vertical" }}
            placeholder="e.g. Re-image 3 affected workstations and rotate service-account credentials before notifying the DPA."
          />

          <label style={lbl}>Specific AI-compliance measures (one per line)</label>
          <textarea
            value={aiMeasures} onChange={e => setAiMeasures(e.target.value)} rows={4}
            style={{ ...inp, resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: 12 }}
            placeholder={"e.g.\n- Disable the affected ML model's inference endpoint until human-in-the-loop review (EU AI Act Art. 14)\n- Capture model input/output logs for the breach window (ISO/IEC 42001 §B.6.2)\n- Re-run DPIA covering the automated decision (GDPR Art. 35 + Art. 22)"}
          />

          <div style={{ marginTop: 10, padding: 10, background: "#fff", border: "1px solid #ddd6fe" }}>
            <div style={{ fontSize: 11, color: "#5b21b6", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Adjust AI risk grading
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#475569" }}>Current grading from AI:</span>
              <span style={{
                background: currentRisk ? RISK_COLOR[currentRisk] : "#94a3b8", color: "#fff",
                fontSize: 10, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.1em",
              }}>{(currentRisk ?? "n/a").toUpperCase()}</span>

              <select value={direction} onChange={e => {
                const d = e.target.value as "none" | "upscale" | "downscale";
                setDirection(d);
                // sensible default for the target rating
                if (d === "upscale" && currentRisk) {
                  setRiskTo(RISK_LEVELS[Math.min(3, RISK_RANK[currentRisk] + 1)] as Risk);
                } else if (d === "downscale" && currentRisk) {
                  setRiskTo(RISK_LEVELS[Math.max(0, RISK_RANK[currentRisk] - 1)] as Risk);
                }
              }} style={inp}>
                <option value="none">No change</option>
                <option value="upscale">Upscale ▲</option>
                <option value="downscale">Downscale ▼</option>
              </select>

              {direction !== "none" && (
                <>
                  <span style={{ fontSize: 12, color: "#475569" }}>→</span>
                  <select value={riskTo} onChange={e => setRiskTo(e.target.value as Risk)} style={inp}>
                    {RISK_LEVELS.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 10 }}>
            <div>
              <label style={lbl}>Legal basis</label>
              <input
                value={legalBasis} onChange={e => setLegalBasis(e.target.value)} style={inp}
                placeholder="GDPR Art. 32 / EU AI Act Art. 14"
              />
            </div>
            <div>
              <label style={lbl}>Rationale for tech</label>
              <input
                value={rationale} onChange={e => setRationale(e.target.value)} style={inp}
                placeholder="Why this matters legally"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={submit} disabled={busy === "create"} style={btn("#7c3aed", true)}>
              {busy === "create" ? "Sending…" : "Dispatch to technical team"}
            </button>
            <button type="button" onClick={reset} style={btn("#64748b")}>Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: 12, padding: "10px 12px", border: "1px dashed #cbd5e1", background: "#f8fafc" }}>
          No legal feedback raised yet. After first review, counsel can dispatch follow-up actions here.
        </div>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map(s => {
            const meta = STATUS_META[s.status] ?? STATUS_META.open;
            const isDone = s.status === "completed" || s.status === "rejected";
            return (
              <li key={s.id} style={{
                border: "1px solid #ddd6fe", background: isDone ? "#f8fafc" : "#fff",
                padding: 12, opacity: isDone ? 0.85 : 1,
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700, padding: "3px 7px", letterSpacing: "0.08em" }}>
                    {meta.label}
                  </span>
                  <span style={{ background: "#ede9fe", color: "#5b21b6", fontSize: 10, fontWeight: 600, padding: "3px 7px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {s.raised_by_role}{s.raised_by_name ? ` · ${s.raised_by_name}` : ""}
                  </span>
                  {s.risk_adjustment_direction !== "none" && s.risk_to && (
                    <span style={{
                      background: RISK_COLOR[s.risk_to as Risk] + "20",
                      color: RISK_COLOR[s.risk_to as Risk],
                      border: `1px solid ${RISK_COLOR[s.risk_to as Risk]}`,
                      fontSize: 10, fontWeight: 700, padding: "3px 7px", letterSpacing: "0.06em",
                    }}>
                      RISK {s.risk_adjustment_direction.toUpperCase()} {directionArrow(s.risk_adjustment_direction)} {(s.risk_from ?? "n/a").toUpperCase()} → {(s.risk_to ?? "").toUpperCase()}
                    </span>
                  )}
                  <span style={{ color: "#64748b", fontSize: 11, marginLeft: "auto" }}>
                    {new Date(s.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ color: "#0f172a", fontSize: 13, fontWeight: 600 }}>{s.recommended_action}</div>

                {s.ai_compliance_measures && (
                  <div style={{ marginTop: 6, padding: 8, background: "#faf5ff", border: "1px solid #ede9fe", fontSize: 12, color: "#1e293b", whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" }}>
                    <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>AI-COMPLIANCE MEASURES</div>
                    {s.ai_compliance_measures}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                  {s.legal_basis && (
                    <span style={{ background: "#dcfce7", color: "#166534", border: "1px solid #22c55e", fontSize: 11, fontFamily: "ui-monospace, monospace", padding: "2px 7px" }}>
                      {s.legal_basis}
                    </span>
                  )}
                  {s.rationale && <span style={{ color: "#475569", fontSize: 12, fontStyle: "italic" }}>{s.rationale}</span>}
                </div>

                {s.tech_response && (
                  <div style={{ marginTop: 8, padding: 8, background: s.status === "completed" ? "#dcfce7" : "#f1f5f9", border: `1px solid ${s.status === "completed" ? "#86efac" : "#cbd5e1"}`, fontSize: 12, color: "#0f172a" }}>
                    <strong style={{ color: s.status === "completed" ? "#166534" : "#475569" }}>Tech response: </strong>
                    {s.tech_response}
                    {s.completed_at && <span style={{ color: "#64748b", fontSize: 11, marginLeft: 6 }}>· {new Date(s.completed_at).toLocaleString()}</span>}
                  </div>
                )}

                {!isDone && (
                  <div style={{ marginTop: 10, padding: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <label style={{ ...lbl, marginTop: 0 }}>Tech response (auditable)</label>
                    <textarea
                      value={responseDraft[s.id] ?? ""}
                      onChange={e => setResponseDraft({ ...responseDraft, [s.id]: e.target.value })}
                      rows={2}
                      style={{ ...inp, resize: "vertical" }}
                      placeholder="What was done, by whom, evidence reference (ticket, log path, hash)…"
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {s.status === "open" && (
                        <button type="button" onClick={() => acknowledge(s)} disabled={busy === s.id} style={btn("#1d4ed8")}>
                          Acknowledge
                        </button>
                      )}
                      <button type="button" onClick={() => complete(s)} disabled={busy === s.id} style={btn("#16a34a", true)}>
                        Mark completed{s.risk_adjustment_direction !== "none" ? " & apply risk change" : ""}
                      </button>
                      <button type="button" onClick={() => reject(s)} disabled={busy === s.id} style={btn("#b91c1c")}>
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

const lbl: React.CSSProperties = {
  fontSize: 11, color: "#475569", display: "block", marginBottom: 4, marginTop: 8, fontWeight: 600,
};
const inp: React.CSSProperties = {
  width: "100%", padding: 8, fontSize: 12, border: "1px solid #cbd5e1",
  background: "#fff", color: "#0f172a",
};
const btn = (color: string, filled = false): React.CSSProperties => ({
  background: filled ? color : "#fff", color: filled ? "#fff" : color,
  border: `1px solid ${color}`, padding: "6px 12px", fontSize: 11,
  fontWeight: 600, letterSpacing: "0.05em", cursor: "pointer",
});

export default LawyerFeedbackLoop;
