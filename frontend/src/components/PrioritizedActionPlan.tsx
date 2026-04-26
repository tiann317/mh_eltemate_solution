import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PrioritizedAction, PriorityLevel } from "@/lib/aegis";

interface Props {
  incidentId?: string;          // when present, completions + oversight persist to DB
  actions: PrioritizedAction[];
  showHeader?: boolean;
}

interface CompletionRow {
  id: string;
  action_key: string;
  completed_by: string | null;
  completed_at: string;
  note: string | null;
}

interface OversightRow {
  id: string;
  action_key: string;
  reviewer_role: string;
  status: string;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

const PRIORITY_META: Record<PriorityLevel, { label: string; color: string; bg: string; border: string }> = {
  P0: { label: "P0 · Critical · Act now",   color: "#b91c1c", bg: "#fee2e2", border: "#ef4444" },
  P1: { label: "P1 · High · Within 24h",    color: "#9a3412", bg: "#ffedd5", border: "#f97316" },
  P2: { label: "P2 · Medium · This week",   color: "#854d0e", bg: "#fef3c7", border: "#eab308" },
  P3: { label: "P3 · Track & document",     color: "#1e40af", bg: "#dbeafe", border: "#3b82f6" },
};

const SOURCE_LABEL: Record<PrioritizedAction["source"], string> = {
  "deadline":     "Statutory deadline",
  "notification": "Notification draft",
  "tech-action":  "Technical action",
  "security":     "Security control",
  "decision":     "Counsel decision",
};

const PrioritizedActionPlan = ({ incidentId, actions, showHeader = true }: Props) => {
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [oversight, setOversight] = useState<OversightRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [oversightFor, setOversightFor] = useState<string | null>(null);
  const [oversightReason, setOversightReason] = useState("");
  const [oversightRole, setOversightRole] = useState("lawyer");

  const refresh = async () => {
    if (!incidentId) return;
    const [{ data: c }, { data: o }] = await Promise.all([
      supabase.from("action_completions").select("id, action_key, completed_by, completed_at, note").eq("incident_id", incidentId),
      supabase.from("oversight_requests").select("id, action_key, reviewer_role, status, reason, created_at, resolved_at").eq("incident_id", incidentId),
    ]);
    setCompletions((c ?? []) as CompletionRow[]);
    setOversight((o ?? []) as OversightRow[]);
  };

  useEffect(() => { refresh(); }, [incidentId]);

  const completedKeys = useMemo(() => new Set(completions.map(c => c.action_key)), [completions]);
  const oversightByKey = useMemo(() => {
    const m = new Map<string, OversightRow[]>();
    oversight.forEach(o => {
      const arr = m.get(o.action_key) ?? [];
      arr.push(o);
      m.set(o.action_key, arr);
    });
    return m;
  }, [oversight]);

  const markDone = async (a: PrioritizedAction, note: string) => {
    if (!incidentId) {
      toast.message("Action acknowledged (not persisted — no incident context).");
      return;
    }
    setBusy(a.key);
    const { error } = await supabase.from("action_completions").insert({
      incident_id: incidentId,
      action_key: a.key,
      action_label: a.title,
      legal_basis: a.legalBasis,
      completed_by: "operator",
      note: note || null,
    });
    if (!error) {
      await supabase.from("audit_logs").insert({
        incident_id: incidentId,
        message: `[${new Date().toISOString()}] Action completed (${a.priority}): ${a.title} — basis ${a.legalBasis}${note ? ` — note: ${note}` : ""}`,
      });
      toast.success("Action recorded as completed");
      setNoteFor(null);
      setNoteText("");
      refresh();
    } else {
      toast.error("Failed to record completion");
    }
    setBusy(null);
  };

  const requestOversight = async (a: PrioritizedAction) => {
    if (!incidentId) {
      toast.message("Oversight requested (not persisted — no incident context).");
      return;
    }
    setBusy(a.key);
    const { error } = await supabase.from("oversight_requests").insert({
      incident_id: incidentId,
      action_key: a.key,
      action_label: a.title,
      reviewer_role: oversightRole,
      reason: oversightReason || null,
      requested_by: "operator",
    });
    if (!error) {
      await supabase.from("audit_logs").insert({
        incident_id: incidentId,
        message: `[${new Date().toISOString()}] Oversight requested (${oversightRole}) on action: ${a.title}${oversightReason ? ` — reason: ${oversightReason}` : ""}`,
      });
      toast.success(`Oversight request sent to ${oversightRole}`);
      setOversightFor(null);
      setOversightReason("");
      setOversightRole("lawyer");
      refresh();
    } else {
      toast.error("Failed to record oversight request");
    }
    setBusy(null);
  };

  const undo = async (a: PrioritizedAction) => {
    if (!incidentId) return;
    const row = completions.find(c => c.action_key === a.key);
    if (!row) return;
    await supabase.from("action_completions").delete().eq("id", row.id);
    await supabase.from("audit_logs").insert({
      incident_id: incidentId,
      message: `[${new Date().toISOString()}] Action completion REVERTED: ${a.title}`,
    });
    toast.message("Completion reverted");
    refresh();
  };

  if (actions.length === 0) {
    return <div style={{ color: "#475569", fontSize: 13 }}>No prioritized actions to display.</div>;
  }

  const total = actions.length;
  const done = actions.filter(a => completedKeys.has(a.key)).length;
  const pendingOversight = oversight.filter(o => o.status === "pending").length;

  return (
    <div>
      {showHeader && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12, gap: 12, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1a56db", fontWeight: 600 }}>
              Prioritized action plan
            </div>
            <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>
              Ordered by urgency & statutory severity. Each item carries a legal anchor and is captured in the audit log when actioned.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 11, fontWeight: 600 }}>
            <span style={{ padding: "4px 10px", background: "#dcfce7", color: "#166534", border: "1px solid #22c55e" }}>
              {done}/{total} completed
            </span>
            {pendingOversight > 0 && (
              <span style={{ padding: "4px 10px", background: "#dbeafe", color: "#1e40af", border: "1px solid #3b82f6" }}>
                {pendingOversight} oversight pending
              </span>
            )}
          </div>
        </div>
      )}

      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {actions.map((a, idx) => {
          const meta = PRIORITY_META[a.priority];
          const isDone = completedKeys.has(a.key);
          const itemOversight = oversightByKey.get(a.key) ?? [];
          const pending = itemOversight.find(o => o.status === "pending");
          const completion = completions.find(c => c.action_key === a.key);

          return (
            <li key={a.key} style={{
              border: `1px solid ${isDone ? "#86efac" : meta.border}`,
              background: isDone ? "#f0fdf4" : "#ffffff",
              padding: 12,
              opacity: isDone ? 0.85 : 1,
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{
                  background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                  fontSize: 10, fontWeight: 700, padding: "3px 7px", letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                }}>{meta.label}</span>
                <span style={{
                  background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1",
                  fontSize: 10, fontWeight: 600, padding: "3px 7px", letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>{SOURCE_LABEL[a.source]}</span>
                <span style={{ color: "#64748b", fontSize: 11, marginLeft: "auto" }}>#{idx + 1}</span>
              </div>

              <div style={{
                color: isDone ? "#475569" : "#0f172a", fontSize: 14, fontWeight: 600,
                marginTop: 8, textDecoration: isDone ? "line-through" : "none",
              }}>{a.title}</div>

              <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.55, marginTop: 4 }}>
                {a.detail}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: "ui-monospace, monospace", fontSize: 11,
                  background: "#dcfce7", color: "#166534", border: "1px solid #22c55e",
                  padding: "2px 7px",
                }}>{a.legalBasis}</span>
                {a.urgencyHours !== null && (
                  <span style={{
                    fontSize: 11, color: a.urgencyHours < 0 ? "#b91c1c" : a.urgencyHours < 4 ? "#b91c1c" : a.urgencyHours < 24 ? "#9a3412" : "#475569",
                    fontWeight: 600,
                  }}>
                    {a.urgencyHours < 0 ? `OVERDUE ${Math.abs(Math.round(a.urgencyHours))}h` : `${Math.round(a.urgencyHours)}h remaining`}
                  </span>
                )}
              </div>

              {isDone && completion && (
                <div style={{
                  marginTop: 8, padding: "6px 10px",
                  background: "#dcfce7", border: "1px solid #86efac",
                  fontSize: 11, color: "#166534",
                }}>
                  ✓ Completed by <strong>{completion.completed_by ?? "—"}</strong> on {new Date(completion.completed_at).toLocaleString()}
                  {completion.note ? <> — “{completion.note}”</> : null}
                </div>
              )}
              {pending && (
                <div style={{
                  marginTop: 8, padding: "6px 10px",
                  background: "#dbeafe", border: "1px solid #93c5fd",
                  fontSize: 11, color: "#1e40af",
                }}>
                  ⚑ Oversight requested ({pending.reviewer_role}) — pending review
                  {pending.reason ? <> — “{pending.reason}”</> : null}
                </div>
              )}

              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {!isDone ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setNoteFor(a.key); setNoteText(""); }}
                      disabled={busy === a.key}
                      style={btn("#16a34a", true)}
                    >Mark done</button>
                    <button
                      type="button"
                      onClick={() => { setOversightFor(a.key); setOversightReason(""); setOversightRole("lawyer"); }}
                      disabled={busy === a.key}
                      style={btn("#1d4ed8")}
                    >Request oversight</button>
                  </>
                ) : (
                  <button type="button" onClick={() => undo(a)} style={btn("#64748b")}>Revert</button>
                )}
              </div>

              {noteFor === a.key && (
                <div style={{ marginTop: 8, padding: 10, background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                  <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 4 }}>
                    Optional note for the audit record (what was done, by whom, evidence reference)
                  </label>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={2}
                    style={{ width: "100%", padding: 8, fontSize: 12, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a" }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button type="button" onClick={() => markDone(a, noteText)} style={btn("#16a34a", true)}>Confirm completion</button>
                    <button type="button" onClick={() => { setNoteFor(null); setNoteText(""); }} style={btn("#64748b")}>Cancel</button>
                  </div>
                </div>
              )}

              {oversightFor === a.key && (
                <div style={{ marginTop: 8, padding: 10, background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                  <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 4 }}>
                    Reviewer role
                  </label>
                  <select
                    value={oversightRole}
                    onChange={e => setOversightRole(e.target.value)}
                    style={{ padding: 6, fontSize: 12, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", marginBottom: 8 }}
                  >
                    <option value="lawyer">Internal Legal</option>
                    <option value="dpo">Data Protection Officer</option>
                    <option value="ciso">CISO</option>
                    <option value="external-counsel">External counsel</option>
                  </select>
                  <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 4 }}>
                    Reason / question for the reviewer
                  </label>
                  <textarea
                    value={oversightReason}
                    onChange={e => setOversightReason(e.target.value)}
                    rows={2}
                    style={{ width: "100%", padding: 8, fontSize: 12, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a" }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button type="button" onClick={() => requestOversight(a)} style={btn("#1d4ed8", true)}>Send oversight request</button>
                    <button type="button" onClick={() => { setOversightFor(null); setOversightReason(""); }} style={btn("#64748b")}>Cancel</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const btn = (color: string, filled = false): React.CSSProperties => ({
  background: filled ? color : "#fff",
  color: filled ? "#fff" : color,
  border: `1px solid ${color}`,
  padding: "6px 12px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.05em",
  cursor: "pointer",
});

export default PrioritizedActionPlan;
