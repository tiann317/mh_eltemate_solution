import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header, Footer } from "@/components/Chrome";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { supabase } from "@/integrations/supabase/client";

// Master directory of internal & external staff that can be assigned to incidents.
// External roles are first-class: external_counsel, regulator_liaison,
// forensics_vendor, auditor_readonly.
const ROLE_OPTIONS: { v: string; l: string }[] = [
  { v: "responder", l: "Responder (tech)" },
  { v: "lawyer", l: "Lawyer (internal)" },
  { v: "dpo", l: "Data Protection Officer" },
  { v: "ciso", l: "CISO / security lead" },
  { v: "external_counsel", l: "External counsel" },
  { v: "regulator_liaison", l: "Regulator / authority liaison" },
  { v: "forensics_vendor", l: "Forensics / IR vendor" },
  { v: "auditor_readonly", l: "Auditor (read-only)" },
  { v: "other", l: "Other" },
];

interface StaffRow {
  id: string;
  name: string;
  email: string | null;
  role: string;
  organisation: string | null;
  available: boolean;
  notes: string | null;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  border: "1px solid #475569", borderRadius: 4,
  background: "#ffffff", color: "#0f172a",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, color: "#475569",
  marginBottom: 4, fontWeight: 600,
};

const StaffDirectory = () => {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("responder");
  const [organisation, setOrganisation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.title = "Staff directory — Aegis Notice";
    return () => { document.title = "Aegis Notice — EU Data Breach Response"; };
  }, []);

  const reload = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_members")
      .select("id, name, email, role, organisation, available, notes")
      .order("name");
    if (error) toast.error("Could not load staff.");
    setRows((data ?? []) as StaffRow[]);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const add = async () => {
    if (!name.trim()) { toast.error("Name is required."); return; }
    const { error } = await supabase.from("staff_members").insert([{
      name: name.trim(),
      email: email.trim() || null,
      role,
      organisation: organisation.trim() || null,
      notes: notes.trim() || null,
    }]);
    if (error) { toast.error("Could not add staff member."); return; }
    toast.success("Staff member added.");
    setName(""); setEmail(""); setOrganisation(""); setNotes(""); setRole("responder");
    reload();
  };

  const toggleAvailable = async (s: StaffRow) => {
    const { error } = await supabase.from("staff_members")
      .update({ available: !s.available }).eq("id", s.id);
    if (error) { toast.error("Update failed."); return; }
    reload();
  };

  const remove = async (s: StaffRow) => {
    if (!confirm(`Remove ${s.name} from the directory?`)) return;
    const { error } = await supabase.from("staff_members").delete().eq("id", s.id);
    if (error) { toast.error("Delete failed (may be referenced by an incident)."); return; }
    reload();
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>
      <a href="#main" className="skip-to-main">Skip to main content</a>
      <Header />
      <main id="main" className="flex-1" style={{ padding: 32 }} aria-labelledby="staff-heading">
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <p style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
            Roster Management
          </p>
          <h2 id="staff-heading" style={{ color: "#0f172a", fontSize: 28, fontWeight: 400, letterSpacing: "0.05em", margin: 0 }}>
            Staff directory
          </h2>
          <p style={{ color: "#475569", fontSize: 14, marginTop: 8, marginBottom: 16 }}>
            Internal responders and external parties (counsel, regulator liaison, forensics, auditors) available for incident allocation.
          </p>

          <LegalDisclaimer compact />

          <section aria-labelledby="add-heading" style={{ marginTop: 24, padding: 16, border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: 4 }}>
            <h3 id="add-heading" style={{ margin: 0, marginBottom: 12, color: "#0f172a", fontSize: 16, fontWeight: 600 }}>
              Add staff member
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label htmlFor="sd-name" style={labelStyle}>Name *</label>
                <input id="sd-name" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="sd-email" style={labelStyle}>Email</label>
                <input id="sd-email" type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="sd-role" style={labelStyle}>Role</label>
                <select id="sd-role" style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sd-org" style={labelStyle}>Organisation</label>
                <input id="sd-org" style={inputStyle} value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="e.g. Hogan Lovells, KPMG" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="sd-notes" style={labelStyle}>Notes</label>
                <input id="sd-notes" style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              onClick={add}
              style={{
                marginTop: 12, background: "#1a56db", color: "#ffffff", border: "none",
                padding: "10px 18px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Add to directory
            </button>
          </section>

          <section aria-labelledby="list-heading" style={{ marginTop: 24 }}>
            <h3 id="list-heading" style={{ margin: 0, marginBottom: 12, color: "#0f172a", fontSize: 16, fontWeight: 600 }}>
              Directory ({rows.length})
            </h3>
            {loading ? (
              <div role="status" style={{ color: "#475569", padding: 20 }}>Loading…</div>
            ) : rows.length === 0 ? (
              <div style={{ color: "#475569", padding: 20, border: "1px dashed #94a3b8" }}>
                No staff yet. Add your first member above.
              </div>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #94a3b8" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#0f172a" }}>
                  <caption className="sr-only">Staff members available for incident allocation.</caption>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                      {["Name", "Role", "Organisation", "Email", "Status", ""].map(h => (
                        <th key={h} scope="col" style={{ padding: "10px 12px", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(s => (
                      <tr key={s.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: "10px 12px" }}>{ROLE_OPTIONS.find(o => o.v === s.role)?.l ?? s.role}</td>
                        <td style={{ padding: "10px 12px" }}>{s.organisation ?? "—"}</td>
                        <td style={{ padding: "10px 12px" }}>{s.email ?? "—"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <button
                            type="button"
                            onClick={() => toggleAvailable(s)}
                            aria-label={`Toggle availability for ${s.name}`}
                            style={{
                              background: s.available ? "#dcfce7" : "#fef3c7",
                              color: s.available ? "#15803d" : "#78350f",
                              border: `1px solid ${s.available ? "#15803d" : "#b45309"}`,
                              padding: "3px 8px", fontSize: 11, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.08em",
                              cursor: "pointer", borderRadius: 3,
                            }}
                          >
                            {s.available ? "Available" : "Unavailable"}
                          </button>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => remove(s)}
                            aria-label={`Remove ${s.name}`}
                            style={{
                              background: "transparent", border: "1px solid #b91c1c",
                              color: "#b91c1c", padding: "4px 10px", borderRadius: 4,
                              cursor: "pointer", fontSize: 12, fontWeight: 600,
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StaffDirectory;
