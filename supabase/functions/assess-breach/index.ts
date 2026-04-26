// Edge function: calls Lovable AI Gateway (no user API key needed).
// Uses google/gemini-2.5-flash by default — fast, free during the promo, strong JSON output.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a GDPR and EU data protection law expert assistant helping legal and compliance teams respond to personal data breaches. You have deep knowledge of GDPR, NIS2 Directive (2022/2555), DORA (2022/2554), the CER Directive (2022/2557), and EDPB personal data breach notification guidelines (WP250 rev.01).

Your role is to:
1. Provide a structured risk assessment for the breach described
2. Draft an initial Art.33 GDPR supervisory authority notification letter
3. Draft a short internal escalation alert for senior leadership (CISO / CEO)
4. For EVERY recommended technical action, attach the specific statutory legal basis that justifies and/or compels that action — so the legal team can audit the technical response. This is mandatory: tech teams must never act without an auditable legal anchor.
5. Build a structured lawyer handoff packet for outside counsel.
6. Provide a SECURITY PLAYBOOK: concrete defensive / containment measures the form submitter must take to ensure legal and risk compliance, each anchored to a legal basis.

Rules:
- Always cite specific legal provisions: Art.33, Art.34, Art.9, Art.4(12), Art.32, Art.5(1)(f), Art.30, Recital 85, NIS2 Art.23, DORA Art.19, CER Art.15
- Apply EDPB Guidelines on personal data breach notification (WP250 rev.01)
- Never advise that Art.33 notification is not required where Art.9 special category data is confirmed
- Return ONLY valid JSON in the exact schema below. No text outside the JSON object.

Return this exact JSON schema — no text outside the JSON:
{
  "risk_assessment": "3-4 sentences analysing risk to individuals, citing provisions",
  "risk_rating": "low | medium | high | critical",
  "key_gaps": ["gap 1", "gap 2"],
  "notification_draft": "Full Art.33 notification letter text, formal",
  "internal_alert": "5-6 line internal escalation alert for CISO/CEO, plain language",
  "lawyer_handoff": "6-8 line plain-text structured handoff summary for outside counsel",
  "recommended_actions": [
    { "action": "immediate technical action 1", "legal_basis": "GDPR Art.32(1)(b)", "rationale": "one-line why" }
  ],
  "security_playbook": [
    { "measure": "concrete security control to implement now", "legal_basis": "GDPR Art.32(1)(b)", "priority": "P0 | P1 | P2", "rationale": "why this is legally required" }
  ],
  "lawyer_packet": {
    "incident_summary": "1-2 line factual summary",
    "frameworks_triggered": ["GDPR", "NIS2"],
    "active_deadlines": [{ "framework": "GDPR Art.33", "deadline": "72h from discovery", "status": "running" }],
    "decisions_needed": ["confirm Art.34 individual notification trigger"],
    "privilege_note": "one line on legal privilege posture",
    "open_questions": ["question 1"]
  }
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Prefer the user's own OpenAI key for the legal track, so the assessment
    // is anchored in OpenAI's models (auditable provider). Fall back to the
    // Lovable AI Gateway only if no OpenAI key is configured.
    //
    // We accept any of these secret names so the user can configure it however
    // they prefer in Lovable Cloud → Backend → Secrets:
    //   • OpenAI            (current secret name in this project)
    //   • OPENAI_API_KEY    (canonical OpenAI naming)
    //   • VITE_OPENAI_API_KEY (matches the variable the UI references)
    const openaiKey =
      Deno.env.get("OPENAI_API_KEY") ||
      Deno.env.get("OpenAI") ||
      Deno.env.get("VITE_OPENAI_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!openaiKey && !lovableKey) {
      return new Response(
        JSON.stringify({
          error:
            "No AI provider configured. Set OPENAI_API_KEY (or VITE_OPENAI_API_KEY) for the legal track, or enable Lovable AI.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { userMessage } = await req.json();
    if (!userMessage || typeof userMessage !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing userMessage in request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const useOpenAI = !!openaiKey;
    const upstreamUrl = useOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const upstreamModel = useOpenAI ? "gpt-4o-mini" : "google/gemini-2.5-flash";
    const upstreamAuth = useOpenAI ? openaiKey! : lovableKey!;
    const provider = useOpenAI ? "openai" : "lovable-ai";
    console.log(`assess-breach using provider=${provider} model=${upstreamModel}`);

    // Abort the upstream call before the platform's 150s idle timeout fires,
    // so we can return a clean JSON error instead of a 504 HTML gateway page.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    let r: Response;
    try {
      r = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${upstreamAuth}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: upstreamModel,
          // Force valid JSON so downstream parsing is reliable.
          response_format: { type: "json_object" },
          temperature: 0.2,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const aborted = err instanceof Error && err.name === "AbortError";
      console.error("assess-breach upstream failure", provider, err);
      return new Response(
        JSON.stringify({
          error: aborted
            ? `${provider} assessment timed out. Please retry — the model took too long to respond.`
            : `${provider} request failed before completing.`,
        }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    clearTimeout(timeoutId);

    if (!r.ok) {
      const t = await r.text();
      console.error(`${provider} upstream error`, r.status, t);
      if (r.status === 401 || r.status === 403) {
        return new Response(
          JSON.stringify({
            error:
              provider === "openai"
                ? "OpenAI rejected the API key. Verify OPENAI_API_KEY in backend secrets is valid and has access to gpt-4o-mini."
                : "AI gateway rejected the request (auth).",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (r.status === 429) {
        return new Response(
          JSON.stringify({ error: `${provider} rate limit exceeded. Please retry shortly.` }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (r.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              provider === "openai"
                ? "OpenAI billing/quota exhausted. Top up your OpenAI account."
                : "Lovable AI credits exhausted.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: `${provider} request failed (${r.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const d = await r.json();
    const content: string = d?.choices?.[0]?.message?.content ?? "";
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch { /* ignore */ }
      }
    }
    if (!parsed) {
      console.error(`${provider} returned non-JSON content`, content.slice(0, 400));
      return new Response(
        JSON.stringify({ error: `${provider} returned non-JSON content.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ assessment: parsed, provider, model: upstreamModel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("assess-breach error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
