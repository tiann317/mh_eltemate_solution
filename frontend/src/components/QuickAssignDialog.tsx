import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ROLE_OPTIONS: { v: string; l: string }[] = [
  { v: "allocated_responder", l: "Allocated responder (tech)" },
  { v: "allocated_lawyer", l: "Allocated lawyer (legal)" },
  { v: "external_counsel", l: "External counsel" },
  { v: "regulator_liaison", l: "Regulator liaison" },
  { v: "forensics_vendor", l: "Forensics / IR vendor" },
  { v: "auditor_readonly", l: "Auditor (read-only)" },
  { v: "observer", l: "Observer" },
];

interface Props {
  incidentId: string;
  open: boolean;
  onClose: () => void;
}

const QuickAssignDialog = ({ incidentId, open, onClose }: Props) => {
  const [staff, setStaff] = useState<{ id: string; name: string; email: string | null; role: string }[]>([]);
  const [chosen, setChosen] = useState("");
  const [chosenRole, setChosenRole] = useState("allocated_responder");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("staff_members").select("id, name, email, role")
        .eq("available", true).order("name");
      setStaff(data ?? []);
    })();
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!chosen) { toast.error("Pick a staff member."); return; }
    const member = staff.find(s => s.id === chosen);
    if (!member) return;
    setBusy(true);
    const { error } = await supabase.from("incident_roles").insert([{
      incident_id: incidentId,
      staff_id: member.id,
      staff_name: member.name,
      staff_email: member.email,
      role: chosenRole,
    }]);
    if (error) { toast.error("Could not assign."); setBusy(false); return; }
    await supabase.from("audit_logs").insert([{
      incident_id: incidentId,
      message: `Role assigned (dashboard quick-assign): ${chosenRole} → ${member.name}`,
    }]);
    toast.success(`Assigned ${member.name}.`);
    setBusy(false);
    setChosen("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qa-title"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff", padding: 24, borderRadius: 6,
          width: "90%", maxWidth: 480, boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h3 id="qa-title" style={{ margin: 0, marginBottom: 12, color: "#0f172a", fontSize: 18, fontWeight: 600 }}>
          Assign staff to incident
        </h3>
        <p style={{ color: "#475569", fontSize: 12, marginTop: 0, marginBottom: 16 }}>
          Incident <code>{incidentId.slice(0, 8)}</code>. Only available staff are shown.
          Manage roster in the Staff directory.
        </p>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="qa-staff" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 4, fontWeight: 600 }}>
            Staff member
          </label>
          <select
            id="qa-staff" value={chosen} onChange={(e) => setChosen(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #475569", borderRadius: 4, background: "#fff", color: "#0f172a" }}
          >
            <option value="">— Select —</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="qa-role" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 4, fontWeight: 600 }}>
            Role on this incident
          </label>
          <select
            id="qa-role" value={chosenRole} onChange={(e) => setChosenRole(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #475569", borderRadius: 4, background: "#fff", color: "#0f172a" }}
          >
            {ROLE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button" onClick={onClose}
            style={{ background: "transparent", color: "#475569", border: "1px solid #94a3b8", padding: "8px 14px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={submit} disabled={busy}
            style={{ background: "#1a56db", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAssignDialog;
