import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationRow {
  id: string;
  incident_id: string;
  framework: string;
  authority: string | null;
  recipient_email: string | null;
  subject: string;
  body: string;
  status: string; // draft | sent
  sent_at: string | null;
  sent_by: string | null;
  delivery_method: string | null;
}

interface Props {
  incidentId: string;
  onChange?: (rows: NotificationRow[]) => void;
}

const FRAMEWORK_LABELS: Record<string, string> = {
  "gdpr-art33": "GDPR Art. 33 — DPA notification (72h)",
  "gdpr-art34": "GDPR Art. 34 — Data subject notification",
  "nis2-early-warning": "NIS2 — Early warning (24h)",
  "nis2-72h": "NIS2 — Incident notification (72h)",
  "dora-initial": "DORA — Initial notification (4h)",
  "cer-art15": "CER Art. 15 — Critical entities (24h)",
  "internal-escalation": "Internal escalation",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  draft: { bg: "rgba(255,196,107,0.15)", fg: "#ffc46b", label: "Draft" },
  sent: { bg: "rgba(82,214,138,0.15)", fg: "#52D68A", label: "Sent" },
};

const NotificationsPanel = ({ incidentId, onChange }: Props) => {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<NotificationRow>>({});

  const refresh = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("incident_id", incidentId)
      .order("framework", { ascending: true });
    if (!error && data) {
      setRows(data as NotificationRow[]);
      onChange?.(data as NotificationRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [incidentId]);

  const startEdit = (r: NotificationRow) => {
    setOpenId(r.id);
    setEdit({ subject: r.subject, body: r.body, recipient_email: r.recipient_email ?? "" });
  };

  const saveEdit = async () => {
    if (!openId) return;
    const { error } = await supabase.from("notifications").update({
      subject: edit.subject,
      body: edit.body,
      recipient_email: edit.recipient_email || null,
    }).eq("id", openId);
    if (error) { toast.error("Save failed"); return; }
    toast.success("Draft updated");
    setOpenId(null);
    refresh();
  };

  const markSent = async (r: NotificationRow, method: "email" | "manual") => {
    if (method === "email" && !r.recipient_email) {
      toast.error("Add a recipient email before sending");
      startEdit(r);
      return;
    }
    const confirmMsg = method === "email"
      ? `Mark this ${FRAMEWORK_LABELS[r.framework] || r.framework} notification as sent to ${r.recipient_email}?`
      : `Record that this notification was sent manually (out-of-band) to ${r.authority || "the authority"}?`;
    if (!window.confirm(confirmMsg)) return;

    const { error } = await supabase.from("notifications").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_by: "operator",
      delivery_method: method,
    }).eq("id", r.id);
    if (error) { toast.error("Failed to record send"); return; }

    await supabase.from("audit_logs").insert({
      incident_id: r.incident_id,
      message: `[${new Date().toISOString()}] Notification ${r.framework} marked as sent (${method}) to ${r.recipient_email || r.authority || "—"}`,
    });
    toast.success(method === "email" ? "Notification recorded as sent" : "Marked as sent");
    refresh();
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
    catch { toast.error("Copy failed"); }
  };

  const download = (r: NotificationRow) => {
    const content = `Framework: ${FRAMEWORK_LABELS[r.framework] || r.framework}\nAuthority: ${r.authority || "—"}\nRecipient: ${r.recipient_email || "—"}\nSubject: ${r.subject}\n\n${r.body}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notification-${r.framework}-${r.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ color: "#a8bbd4", fontSize: 12 }}>Loading notifications…</div>;
  if (rows.length === 0) return <div style={{ color: "#64748b", fontSize: 12 }}>No notifications generated for this incident.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ color: "#a8bbd4", fontSize: 11, lineHeight: 1.6 }}>
        Statutory notification drafts pre-filled from incident data. Edit, copy, or mark as sent. <strong style={{ color: "#ffc46b" }}>Sending is recorded in the audit log</strong> — outbound transmission to the authority is performed by your DPO/legal team using approved channels.
      </div>
      {rows.map(r => {
        const status = STATUS_COLORS[r.status] || STATUS_COLORS.draft;
        const isOpen = openId === r.id;
        return (
          <div key={r.id} style={{ border: "1px solid rgba(255,255,255,0.08)", background: "#0d1b2e" }}>
            <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: isOpen ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ background: status.bg, color: status.fg, fontSize: 10, padding: "2px 8px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{status.label}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{FRAMEWORK_LABELS[r.framework] || r.framework}</div>
                <div style={{ color: "#a8bbd4", fontSize: 11, marginTop: 2 }}>
                  {r.authority || "—"}
                  {r.recipient_email ? ` · ${r.recipient_email}` : ""}
                  {r.sent_at ? ` · sent ${new Date(r.sent_at).toLocaleString()} (${r.delivery_method || "—"})` : ""}
                </div>
              </div>
              <button
                onClick={() => isOpen ? setOpenId(null) : startEdit(r)}
                style={btn("#63AFF0")}
              >
                {isOpen ? "Close" : r.status === "sent" ? "View" : "Review & edit"}
              </button>
            </div>
            {isOpen && (
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={lbl}>Recipient email
                  <input
                    type="email"
                    value={edit.recipient_email ?? ""}
                    onChange={e => setEdit(p => ({ ...p, recipient_email: e.target.value }))}
                    placeholder="dpa@example.eu"
                    disabled={r.status === "sent"}
                    style={inp}
                  />
                </label>
                <label style={lbl}>Subject
                  <input
                    type="text"
                    value={edit.subject ?? ""}
                    onChange={e => setEdit(p => ({ ...p, subject: e.target.value }))}
                    disabled={r.status === "sent"}
                    style={inp}
                  />
                </label>
                <label style={lbl}>Body (statutory draft)
                  <textarea
                    value={edit.body ?? ""}
                    onChange={e => setEdit(p => ({ ...p, body: e.target.value }))}
                    disabled={r.status === "sent"}
                    rows={14}
                    style={{ ...inp, fontFamily: "ui-monospace, monospace", fontSize: 11, lineHeight: 1.55, resize: "vertical" }}
                  />
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.status !== "sent" && <button onClick={saveEdit} style={btn("#63AFF0", true)}>Save draft</button>}
                  <button onClick={() => copy(`${edit.subject ?? r.subject}\n\n${edit.body ?? r.body}`)} style={btn("#a8bbd4")}>Copy text</button>
                  <button onClick={() => download(r)} style={btn("#a8bbd4")}>Download .txt</button>
                  {r.status !== "sent" && (
                    <>
                      <button onClick={() => markSent(r, "email")} style={btn("#52D68A", true)}>Send & mark sent</button>
                      <button onClick={() => markSent(r, "manual")} style={btn("#52D68A")}>Mark sent (manual)</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const btn = (color: string, filled = false): React.CSSProperties => ({
  background: filled ? color : "transparent",
  color: filled ? "#0a1525" : color,
  border: `1px solid ${color}`,
  padding: "6px 12px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.05em",
  cursor: "pointer",
});
const lbl: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, color: "#a8bbd4", fontSize: 11 };
const inp: React.CSSProperties = {
  background: "#0a1525",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#e2e8f0",
  padding: "8px 10px",
  fontSize: 12,
};

export default NotificationsPanel;
