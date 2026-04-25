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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured." }),
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

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("Lovable AI error", r.status, t);
      if (r.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (r.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: `AI request failed (${r.status})` }),
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
      return new Response(
        JSON.stringify({ error: "AI returned non-JSON content." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ assessment: parsed }), {
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
