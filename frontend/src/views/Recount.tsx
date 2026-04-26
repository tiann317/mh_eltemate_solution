import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Header, Footer } from "@/components/Chrome";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { TOP_TEN_PROMPTS } from "@/lib/literacy";
import { supabase } from "@/integrations/supabase/client";

// Plain-language path for non-qualified reporters.
// - Free-text retelling, with the 10 likely questions as gentle prompts.
// - No legal evaluation is shown.
// - Prominent escalate button hands off to an available staff member.
const Recount = () => {
  const { preIntakeId } = useParams<{ preIntakeId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Tell us what happened — Aegis Notice";
    return () => { document.title = "Aegis Notice — EU Data Breach Response"; };
  }, []);

  const [story, setStory] = useState("");
  const [staff, setStaff] = useState<{ id: string; name: string; role: string; available: boolean }[]>([]);
  const [chosenStaff, setChosenStaff] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("staff_members")
        .select("id, name, role, available")
        .eq("available", true)
        .order("name");
      setStaff(data ?? []);
    })();
  }, []);

  const saveStory = async () => {
    if (!story.trim()) { toast.error("Please write a few sentences first."); return; }
    setSubmitting(true);
    const { error } = await supabase
      .from("pre_intakes")
      .update({ story })
      .eq("id", preIntakeId!);
    setSubmitting(false);
    if (error) { toast.error("Could not save your story."); return; }
    toast.success("Your story has been saved. A staff member will follow up.");
  };

  const escalate = async () => {
    if (!chosenStaff) { toast.error("Please pick someone to escalate to."); return; }
    setSubmitting(true);
    await supabase.from("pre_intakes").update({
      story,
      escalated: true,
      escalated_to_staff_id: chosenStaff,
    }).eq("id", preIntakeId!);
    setSubmitting(false);
    toast.success("Escalated. The staff member has been notified.");
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>
      <a href="#main" className="skip-to-main">Skip to main content</a>
      <Header />
      <main id="main" className="flex-1" style={{ padding: 32 }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <p style={{ color: "#1a56db", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
            Plain-language path
          </p>
          <h2 style={{ color: "#0f172a", fontSize: 26, fontWeight: 400, letterSpacing: "0.05em", marginTop: 6 }}>
            Tell us what happened — in your own words
          </h2>
          <p style={{ color: "#475569", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            You don't need to use any technical or legal terms. A trained staff
            member will read this and follow up. If you'd like, you can talk to
            someone right now — use the escalate button below.
          </p>

          <div style={{ marginTop: 16 }}><LegalDisclaimer /></div>

          <section style={{ marginTop: 24 }} aria-labelledby="prompts-heading">
            <h3 id="prompts-heading" style={{ color: "#0f172a", fontSize: 16, marginBottom: 8 }}>
              Things that will help us — feel free to skip any
            </h3>
            <ol style={{ paddingLeft: 20, color: "#0f172a", fontSize: 13, lineHeight: 1.7 }}>
              {TOP_TEN_PROMPTS.map((p, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <strong style={{ color: "#0f172a" }}>{p.q}</strong>
                  <div style={{ color: "#475569", fontSize: 12 }}>{p.hint}</div>
                </li>
              ))}
            </ol>
          </section>

          <section style={{ marginTop: 24 }} aria-labelledby="story-heading">
            <h3 id="story-heading" style={{ color: "#0f172a", fontSize: 16, marginBottom: 8 }}>Your story</h3>
            <label htmlFor="story" className="sr-only">Describe what happened</label>
            <textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={10}
              style={{
                width: "100%", padding: 12, fontSize: 14, lineHeight: 1.55,
                border: "1px solid #475569", borderRadius: 4, color: "#0f172a", background: "#ffffff",
                fontFamily: "inherit", resize: "vertical",
              }}
              placeholder="Take your time. Write as much or as little as you like."
            />
            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={saveStory}
                disabled={submitting}
                style={{
                  background: "#ffffff", color: "#1a56db", border: "1px solid #1a56db",
                  padding: "10px 18px", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Save my story
              </button>
            </div>
          </section>

          <section
            style={{
              marginTop: 24, padding: 16, borderRadius: 4,
              background: "#eff6ff", border: "1px solid #1a56db",
            }}
            aria-labelledby="escalate-heading"
          >
            <h3 id="escalate-heading" style={{ color: "#1e3a8a", fontSize: 16, marginBottom: 8 }}>
              Talk to someone now
            </h3>
            <p style={{ color: "#1e3a8a", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              Pick an available staff member or external responder and we'll
              hand the situation over to them along with what you've written.
            </p>
            <label htmlFor="staff" style={{ display: "block", fontSize: 13, color: "#1e3a8a", marginBottom: 4, fontWeight: 600 }}>
              Available now
            </label>
            <select
              id="staff"
              value={chosenStaff}
              onChange={(e) => setChosenStaff(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", fontSize: 14, color: "#0f172a",
                background: "#ffffff", border: "1px solid #1a56db", borderRadius: 4,
              }}
            >
              <option value="">— Select —</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={escalate}
              disabled={submitting || !chosenStaff}
              style={{
                marginTop: 12,
                background: "#b91c1c", color: "#ffffff", border: "none",
                padding: "12px 22px", borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Escalate to this person now →
            </button>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Recount;
