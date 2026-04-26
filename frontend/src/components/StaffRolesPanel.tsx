import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Manage allocated and reporting staff for an incident — for audit.
// Roles include external parties: external_counsel, regulator_liaison,
// forensics_vendor, auditor_readonly.
const ROLE_OPTIONS: { v: string; l: string }[] = [
  { v: "reporter", l: "Reporter (originator)" },
  { v: "allocated_responder", l: "Allocated responder (tech)" },
  { v: "allocated_lawyer", l: "Allocated lawyer (legal)" },
  { v: "external_counsel", l: "External counsel" },
  { v: "regulator_liaison", l: "Regulator / authority liaison" },
  { v: "forensics_vendor", l: "Forensics / IR vendor" },
  { v: "auditor_readonly", l: "Auditor (read-only)" },
  { v: "observer", l: "Observer" },
];

interface IncidentRoleRow {
  id: string;
  role: string;
  staff_name: string;
  staff_email: string | null;
  assigned_at: string;
}

const StaffRolesPanel = ({ incidentId }: { incidentId: string }) => {
  const [rows, setRows] = useState<IncidentRoleRow[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string; email: string | null; role: string }[]>([]);
  const [chosen, setChosen] = useState("");
  const [chosenRole, setChosenRole] = useState("allocated_responder");

  const reload = async () => {
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from("incident_roles").select("*").eq("incident_id", incidentId).order("assigned_at"),
      supabase.from("staff_members").select("id, name, email, role").order("name"),
    ]);
    setRows((r ?? []) as IncidentRoleRow[]);
    setStaff(s ?? []);
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [incidentId]);

  const add = async () => {
    if (!chosen) { toast.error("Pick a staff member."); return; }
    const member = staff.find(m => m.id === chosen);
    if (!member) return;
    const { error } = await supabase.from("incident_roles").insert([{
      incident_id: incidentId,
      staff_id: member.id,
      staff_name: member.name,
      staff_email: member.email,
      role: chosenRole,
    }]);
    if (error) { toast.error("Could not assign."); return; }
    await supabase.from("audit_logs").insert([{
      incident_id: incidentId,
      message: `Role assigned: ${chosenRole} → ${member.name}`,
    }]);
    setChosen("");
    reload();
  };

  const remove = async (id: string, label: string) => {
    await supabase.from("incident_roles").delete().eq("id", id);
    await supabase.from("audit_logs").insert([{ incident_id: incidentId, message: `Role removed: ${label}` }]);
    reload();
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 4, padding: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#0f172a", marginBottom: 12 }}>
        <caption className="sr-only">Assigned staff and roles for this incident.</caption>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th scope="col" style={{ padding: "8px 10px", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Role</th>
            <th scope="col" style={{ padding: "8px 10px", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Person</th>
            <th scope="col" style={{ padding: "8px 10px", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</th>
            <th scope="col" style={{ padding: "8px 10px", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Since</th>
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 12, color: "#475569" }}>No roles assigned yet.</td></tr>
          )}
          {rows.map(r => (
            <tr key={r.id} style={{ borderTop: "1px solid #e2e8f0" }}>
              <td style={{ padding: "8px 10px" }}>{ROLE_OPTIONS.find(o => o.v === r.role)?.l ?? r.role}</td>
              <td style={{ padding: "8px 10px" }}>{r.staff_name}</td>
              <td style={{ padding: "8px 10px" }}>{r.staff_email ?? "—"}</td>
              <td style={{ padding: "8px 10px" }}>{new Date(r.assigned_at).toLocaleString()}</td>
              <td style={{ padding: "8px 10px", textAlign: "right" }}>
                <button
                  type="button"
                  onClick={() => remove(r.id, `${r.role} → ${r.staff_name}`)}
                  aria-label={`Remove ${r.staff_name} as ${r.role}`}
                  style={{
                    background: "transparent", border: "1px solid #b91c1c", color: "#b91c1c",
                    padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor="staff-pick" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 4, fontWeight: 600 }}>
            Staff member
          </label>
          <select
            id="staff-pick"
            value={chosen}
            onChange={(e) => setChosen(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #475569", borderRadius: 4, background: "#ffffff", color: "#0f172a" }}
          >
            <option value="">— Select —</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor="role-pick" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 4, fontWeight: 600 }}>
            Role
          </label>
          <select
            id="role-pick"
            value={chosenRole}
            onChange={(e) => setChosenRole(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #475569", borderRadius: 4, background: "#ffffff", color: "#0f172a" }}
          >
            {ROLE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={add}
          style={{
            background: "#1a56db", color: "#ffffff", border: "none",
            padding: "10px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Assign
        </button>
      </div>
    </div>
  );
};

export default StaffRolesPanel;
