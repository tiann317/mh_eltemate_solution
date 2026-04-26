import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Header, Footer } from "@/components/Chrome";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { EscalateButton } from "@/components/EscalateButton";
import { supabase } from "@/integrations/supabase/client";
import { classifyLiteracy } from "@/lib/literacy";

// Pre-intake form: every reporter starts here. Captures contact info,
// auto-classifies tech literacy, and routes to either the full intake
// (qualified) or the plain-language story path (non_qualified).
const PreIntake = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Pre-intake — Aegis Notice";
    return () => { document.title = "Aegis Notice — EU Data Breach Response"; };
  }, []);

  const [form, setForm] = useState({
    reporter_name: "",
    reporter_title: "",
    reporter_department: "",
    reporter_role: "",
    contact_email: "",
    contact_phone: "",
    self_check_1: "",
    self_check_2: "",
    self_check_3: "",
    severity_classification: "suspected" as "suspected" | "definite",
    responsible_staff_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [savedPreIntakeId, setSavedPreIntakeId] = useState<string | null>(null);
  const [staff, setStaff] = useState<{ id: string; name: string; email: string | null }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("staff_members")
        .select("id, name, email")
        .eq("available", true)
        .order("name");
      setStaff(data ?? []);
    })();
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    if (!form.reporter_name.trim()) { toast.error("Please enter your name."); return false; }
    if (!form.contact_email.trim()) { toast.error("Please enter a contact email."); return false; }
    if (!form.self_check_1 || !form.self_check_2 || !form.self_check_3) {
      toast.error("Please answer all three self-check questions.");
      return false;
    }
    return true;
  };

  const savePreIntake = async (): Promise<{ id: string; literacy: string } | null> => {
    if (savedPreIntakeId) {
      return { id: savedPreIntakeId, literacy: "qualified" };
    }
    const literacy = classifyLiteracy({
      title: form.reporter_title,
      role: form.reporter_role,
      department: form.reporter_department,
      selfCheck1: form.self_check_1,
      selfCheck2: form.self_check_2,
      selfCheck3: form.self_check_3,
    });
    const { data, error } = await supabase
      .from("pre_intakes")
      .insert([{ ...form, literacy, responsible_staff_id: form.responsible_staff_id || null }])
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Could not save pre-intake. Please try again.");
      return null;
    }
    setSavedPreIntakeId(data.id);
    return { id: data.id, literacy };
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const saved = await savePreIntake();
    setSubmitting(false);
    if (!saved) return;
    if (saved.literacy === "qualified") {
      navigate("/intake", { state: { preIntakeId: saved.id, severity: form.severity_classification } });
    } else {
      navigate(`/recount/${saved.id}`);
    }
  };

  // Saves (if needed) without navigating, so the EscalateButton can fire.
  const ensureSavedForEscalation = async (): Promise<string | null> => {
    if (!validate()) return null;
    const saved = await savePreIntake();
    return saved?.id ?? null;
  };

  // WCAG: labels tied to inputs, error/help text via aria-describedby, focus styles inherited from index.css.
  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: 14,
    border: "1px solid #475569", borderRadius: 4, background: "#ffffff", color: "#0f172a",
  };

  const RadioRow = ({
    name, value, onChange, label, helper,
  }: { name: string; value: string; onChange: (v: string) => void; label: string; helper?: string }) => (
    <fieldset style={{ border: "1px solid #cbd5e1", padding: 12, borderRadius: 4, marginBottom: 12 }}>
      <legend style={{ padding: "0 6px", fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{label}</legend>
      {helper && <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>{helper}</div>}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { v: "yes", l: "Yes" },
          { v: "unsure", l: "Not sure" },
          { v: "no", l: "No" },
        ].map(o => (
          <label key={o.v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#0f172a", cursor: "pointer" }}>
            <input
              type="radio" name={name} value={o.v} checked={value === o.v}
              onChange={(e) => onChange(e.target.value)}
            />
            {o.l}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>
      <a href="#main" className="skip-to-main">Skip to main content</a>
      <Header />
      <main id="main" className="flex-1" style={{ padding: 32 }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <p style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
            Before we start
          </p>
          <h2 style={{ color: "#0f172a", fontSize: 26, fontWeight: 400, letterSpacing: "0.05em", marginTop: 6 }}>
            Let's start with a few details about you
          </h2>
          <p style={{ color: "#475569", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Reporting an incident can feel stressful — thank you for speaking up.
            These few questions help us match you with the right next step:
            either a short plain-language form, or the full technical intake if
            you're already on the response team. There are no wrong answers, and
            you can change paths at any point.
          </p>
          <p style={{ color: "#475569", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
            <strong style={{ color: "#0f172a" }}>What we do with your answers.</strong>{" "}
            We use them only to handle this incident and to keep an audit record,
            as required by data-protection law. Your details are visible to your
            organisation's response team and are not shared outside it without
            your knowledge.
          </p>

          <div style={{ marginTop: 16 }}><LegalDisclaimer /></div>

          <section style={{ marginTop: 24 }} aria-labelledby="contact-heading">
            <h3 id="contact-heading" style={{ color: "#0f172a", fontSize: 16, marginBottom: 12 }}>About you</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ fontSize: 13, color: "#0f172a" }}>
                Full name *
                <input style={fieldStyle} value={form.reporter_name} onChange={(e) => set("reporter_name", e.target.value)} required />
              </label>
              <label style={{ fontSize: 13, color: "#0f172a" }}>
                Job title
                <input style={fieldStyle} value={form.reporter_title} onChange={(e) => set("reporter_title", e.target.value)} placeholder="e.g. Head of Security, Accountant, Marketing Lead" />
              </label>
              <label style={{ fontSize: 13, color: "#0f172a" }}>
                Team or department
                <input style={fieldStyle} value={form.reporter_department} onChange={(e) => set("reporter_department", e.target.value)} placeholder="e.g. Security, Finance, HR" />
              </label>
              <label style={{ fontSize: 13, color: "#0f172a" }}>
                What are you doing on this incident?
                <input style={fieldStyle} value={form.reporter_role} onChange={(e) => set("reporter_role", e.target.value)} placeholder="e.g. I'm leading the response, I noticed something odd, I was asked to report it" />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 13, color: "#0f172a" }}>
                  Contact email *
                  <input type="email" style={fieldStyle} value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} required />
                </label>
                <label style={{ fontSize: 13, color: "#0f172a" }}>
                  Contact phone
                  <input type="tel" style={fieldStyle} value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
                </label>
              </div>
            </div>
          </section>

          <section style={{ marginTop: 24 }} aria-labelledby="severity-heading">
            <h3 id="severity-heading" style={{ color: "#0f172a", fontSize: 16, marginBottom: 12 }}>How sure are you that something has gone wrong?</h3>
            <fieldset style={{ border: "1px solid #cbd5e1", padding: 12, borderRadius: 4 }}>
              <legend className="sr-only">How sure are you</legend>
              {[
                { v: "suspected", l: "I think something may be wrong, but I'm not certain yet" },
                { v: "definite", l: "I'm sure — an incident or data breach has happened" },
              ].map(o => (
                <label key={o.v} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#0f172a", padding: "6px 0", cursor: "pointer" }}>
                  <input
                    type="radio" name="severity" value={o.v}
                    checked={form.severity_classification === o.v}
                    onChange={() => set("severity_classification", o.v as "suspected" | "definite")}
                  />
                  {o.l}
                </label>
              ))}
            </fieldset>
            <p style={{ fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 1.6 }}>
              It is fine to report something you're not sure about. Spotting it
              early is what matters — your response team will work out the rest.
            </p>
          </section>

          <section style={{ marginTop: 24 }} aria-labelledby="checks-heading">
            <h3 id="checks-heading" style={{ color: "#0f172a", fontSize: 16, marginBottom: 4 }}>Three quick questions</h3>
            <p style={{ fontSize: 13, color: "#475569", marginBottom: 12, lineHeight: 1.6 }}>
              These help us pick the right form for you. Answering "no" or "not
              sure" is fine — it just means we'll keep the language plain.
            </p>
            <RadioRow
              name="sc1"
              label="Are you comfortable describing the IT systems involved?"
              helper="For example: which application, server, or device this happened on."
              value={form.self_check_1}
              onChange={(v) => set("self_check_1", v)}
            />
            <RadioRow
              name="sc2"
              label="Are you familiar with data-protection terms like 'personal data breach' or 'GDPR'?"
              helper="No need to be an expert — just whether the wording feels familiar."
              value={form.self_check_2}
              onChange={(v) => set("self_check_2", v)}
            />
            <RadioRow
              name="sc3"
              label="Have you helped respond to a security incident before?"
              value={form.self_check_3}
              onChange={(v) => set("self_check_3", v)}
            />
            
          </section>

          <section style={{ marginTop: 24 }} aria-labelledby="resp-heading">
            <h3 id="resp-heading" style={{ color: "#0f172a", fontSize: 16, marginBottom: 4 }}>
              Who should handle this report?
            </h3>
            <p style={{ fontSize: 13, color: "#475569", marginBottom: 12, lineHeight: 1.6 }}>
              Pick the colleague best placed to take this forward (e.g. your
              security lead, DPO, or line manager). They'll be recorded as the
              responsible person and notified by email when you escalate.
            </p>
            <select
              style={fieldStyle}
              value={form.responsible_staff_id}
              onChange={(e) => set("responsible_staff_id", e.target.value)}
            >
              <option value="">— Select a colleague (optional) —</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.email ? ` (${s.email})` : ""}
                </option>
              ))}
            </select>
          </section>

          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              style={{
                background: "#1a56db", color: "#ffffff", border: "none",
                padding: "12px 24px", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              {submitting ? "Saving…" : "Continue →"}
            </button>
            <Link
              to="/dashboard"
              style={{ color: "#1a56db", padding: "12px 16px", textDecoration: "underline", fontSize: 14 }}
            >
              View dashboard instead
            </Link>
          </div>
          <p style={{ color: "#475569", fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>
            We keep a record of your answers so the response can be properly
            documented, as data-protection law requires. The path we suggest
            next is just a starting point — you can switch at any time.
          </p>

          <PreIntakeEscalation
            staffId={form.responsible_staff_id}
            preIntakeId={savedPreIntakeId}
            reporterName={form.reporter_name}
            reporterEmail={form.contact_email}
            ensureSaved={ensureSavedForEscalation}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

/**
 * Wraps EscalateButton so it can save the pre-intake first if the user
 * hasn't yet clicked Continue.
 */
const PreIntakeEscalation = ({
  staffId, preIntakeId, reporterName, reporterEmail, ensureSaved,
}: {
  staffId: string;
  preIntakeId: string | null;
  reporterName: string;
  reporterEmail: string;
  ensureSaved: () => Promise<string | null>;
}) => {
  const [resolvedId, setResolvedId] = useState<string | null>(preIntakeId);
  useEffect(() => { if (preIntakeId) setResolvedId(preIntakeId); }, [preIntakeId]);

  const [pending, setPending] = useState(false);
  const handlePreSave = async () => {
    if (resolvedId) return;
    setPending(true);
    const id = await ensureSaved();
    setPending(false);
    if (id) setResolvedId(id);
  };

  if (!resolvedId) {
    return (
      <div style={{ marginTop: 24 }}>
        <div style={{ padding: 16, border: "1px solid #cbd5e1", borderRadius: 4, background: "#f8fafc" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
            Escalate to responsible person
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 12, lineHeight: 1.5 }}>
            Save your details first, then we'll notify the colleague you picked
            above by email so they can take this forward immediately.
          </div>
          <button
            type="button"
            onClick={handlePreSave}
            disabled={pending || !staffId}
            style={{
              background: staffId ? "#b91c1c" : "#cbd5e1",
              color: staffId ? "#ffffff" : "#64748b",
              border: "none",
              padding: "10px 18px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              cursor: pending ? "wait" : (staffId ? "pointer" : "not-allowed"),
            }}
          >
            {pending ? "Saving…" : "Save & escalate now"}
          </button>
          {!staffId && (
            <div style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>
              Pick a responsible person above to enable escalation.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <EscalateButton
      source="pre_intake"
      preIntakeId={resolvedId}
      staffId={staffId}
      showPicker={!staffId}
      reporterName={reporterName}
      reporterEmail={reporterEmail}
      label="Escalate to responsible person"
    />
  );
};

export default PreIntake;
