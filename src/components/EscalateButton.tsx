import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Staff {
  id: string;
  name: string;
  email: string | null;
  role: string;
}

interface Props {
  /** Pre-selected staff (e.g. from form). If omitted, user picks. */
  staffId?: string;
  onStaffIdChange?: (id: string) => void;
  source: "pre_intake" | "incident";
  preIntakeId?: string;
  incidentId?: string;
  reporterName?: string;
  reporterEmail?: string;
  /** When true, render an inline staff <select> + button. When false, just a button. */
  showPicker?: boolean;
  label?: string;
  /** Light/dark theme — defaults to light (for pre-intake). */
  theme?: "light" | "dark";
}

/**
 * EscalateButton — assigns the chosen staff member as responsible for this
 * report and (best-effort) emails them.
 */
export const EscalateButton = ({
  staffId,
  onStaffIdChange,
  source,
  preIntakeId,
  incidentId,
  reporterName,
  reporterEmail,
  showPicker = true,
  label = "Escalate to responsible person",
  theme = "light",
}: Props) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [chosen, setChosen] = useState(staffId ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setChosen(staffId ?? ""); }, [staffId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("staff_members")
        .select("id, name, email, role")
        .eq("available", true)
        .order("name");
      setStaff(data ?? []);
    })();
  }, []);

  const dark = theme === "dark";
  const labelColor = dark ? "#e2e8f0" : "#0f172a";
  const helperColor = dark ? "#a8bbd4" : "#475569";
  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: 13,
    border: dark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #475569",
    borderRadius: 4,
    background: dark ? "rgba(255,255,255,0.04)" : "#ffffff",
    color: labelColor,
  };

  const submit = async () => {
    if (!chosen) { toast.error("Pick the responsible person first."); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("escalate-incident", {
      body: {
        source,
        pre_intake_id: preIntakeId,
        incident_id: incidentId,
        staff_id: chosen,
        reason: reason.trim() || undefined,
        reporter_name: reporterName,
        reporter_email: reporterEmail,
      },
    });
    setBusy(false);
    if (error || !data?.ok) {
      toast.error("Could not escalate. Please try again.");
      return;
    }
    const emailMsg =
      data.email_status === "sent" ? " (email sent)" :
      data.email_status === "error" ? " (email could not be sent)" :
      data.email_status === "skipped" ? "" : "";
    toast.success(`Escalated to ${data.staff_name}.${emailMsg}`);
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #cbd5e1",
        borderRadius: 4,
        background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: labelColor, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: helperColor, marginBottom: 12, lineHeight: 1.5 }}>
        Assigns this report to a colleague and notifies them by email so they can take it forward.
      </div>

      {showPicker && (
        <label style={{ display: "block", fontSize: 12, color: labelColor, marginBottom: 8 }}>
          Responsible person
          <select
            style={fieldStyle}
            value={chosen}
            onChange={(e) => { setChosen(e.target.value); onStaffIdChange?.(e.target.value); }}
          >
            <option value="">— Select a colleague —</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}{s.email ? ` (${s.email})` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <label style={{ display: "block", fontSize: 12, color: labelColor, marginBottom: 12 }}>
        Short note (optional)
        <input
          style={fieldStyle}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Possible ransomware on finance laptop"
        />
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={busy || !chosen}
        style={{
          background: chosen ? "#1a56db" : (dark ? "rgba(255,255,255,0.1)" : "#cbd5e1"),
          color: chosen ? "#ffffff" : (dark ? "#a8bbd4" : "#64748b"),
          border: "none",
          padding: "10px 18px",
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          cursor: busy ? "wait" : (chosen ? "pointer" : "not-allowed"),
        }}
      >
        {busy ? "Escalating…" : "Escalate now"}
      </button>
    </div>
  );
};

export default EscalateButton;
