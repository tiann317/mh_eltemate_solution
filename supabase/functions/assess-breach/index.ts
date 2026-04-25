// Edge function: calls the LDA Legal Data Hub chat endpoint to produce a
// grounded GDPR/NIS2/DORA breach assessment. Replaces the previous OpenAI /
// Lovable AI Gateway path so all assessments are anchored in LDA legal sources.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_INSTRUCTIONS = `Du bist ein Experte für DSGVO und EU-Datenschutzrecht. Du hilfst Rechts- und Compliance-Teams bei der Reaktion auf Datenschutzverletzungen. Du kennst DSGVO, NIS2-Richtlinie (2022/2555), DORA (2022/2554), CER-Richtlinie (2022/2557) und die EDSA-Leitlinien zur Meldung von Verletzungen des Schutzes personenbezogener Daten (WP250 rev.01).

Aufgaben:
1. Strukturiertes Risk Assessment der beschriebenen Datenpanne
2. Entwurf einer Erstmeldung an die Aufsichtsbehörde (Art. 33 DSGVO)
3. Kurze interne Eskalationsmeldung an CISO/CEO
4. Für JEDE empfohlene technische Maßnahme die spezifische gesetzliche Grundlage angeben (auditierbare Rechtsverankerung)
5. Strukturiertes Lawyer-Handoff-Paket für externe Anwälte
6. SECURITY PLAYBOOK: konkrete Schutz-/Eindämmungsmaßnahmen mit Rechtsgrundlage

Regeln:
- Konkrete Vorschriften zitieren: Art. 33, Art. 34, Art. 9, Art. 4 Nr. 12, Art. 32, Art. 5 Abs. 1 lit. f, Art. 30, ErwGr 85, NIS2 Art. 23, DORA Art. 19, CER Art. 15
- EDSA-Leitlinien WP250 rev.01 anwenden
- Bei bestätigten besonderen Kategorien (Art. 9) niemals raten, dass eine Art.-33-Meldung entbehrlich sei
- Antworte AUSSCHLIESSLICH mit gültigem JSON in genau dem unten angegebenen Schema. Kein Text vor oder nach dem JSON-Objekt. Keine Markdown-Codefences.

Genaues JSON-Schema:
{
  "risk_assessment": "3-4 Sätze Risikoanalyse mit Zitaten",
  "risk_rating": "low | medium | high | critical",
  "key_gaps": ["gap 1", "gap 2"],
  "notification_draft": "Vollständiger Entwurf der Art.-33-Meldung, formell",
  "internal_alert": "5-6 Zeilen interne Eskalation für CISO/CEO, einfache Sprache",
  "lawyer_handoff": "6-8 Zeilen strukturierte Übergabezusammenfassung für externen Anwalt",
  "recommended_actions": [
    { "action": "sofortige technische Maßnahme", "legal_basis": "DSGVO Art. 32 Abs. 1 lit. b", "rationale": "ein Satz Begründung" }
  ],
  "security_playbook": [
    { "measure": "konkrete Schutzmaßnahme", "legal_basis": "DSGVO Art. 32 Abs. 1 lit. b", "priority": "P0 | P1 | P2", "rationale": "warum rechtlich erforderlich" }
  ],
  "lawyer_packet": {
    "incident_summary": "1-2 Zeilen Sachverhalt",
    "frameworks_triggered": ["GDPR", "NIS2"],
    "active_deadlines": [{ "framework": "GDPR Art.33", "deadline": "72h ab Kenntnis", "status": "running" }],
    "decisions_needed": ["Art.-34-Pflicht bestätigen"],
    "privilege_note": "ein Satz zum Privilegstatus",
    "open_questions": ["Frage 1"]
  }
}`;

// Hard-coded LDA hackathon credentials (matches query-lda function).
const LDA_CLIENT_ID = "hack01-0fec5330b1ef9f63";
const LDA_CLIENT_SECRET = "41bbeb1670283fc4a73db8dcf2bc3b5d";

async function getLDAToken(): Promise<string | null> {
  try {
    const r = await fetch("https://online.otto-schmidt.de/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: LDA_CLIENT_ID,
        client_secret: LDA_CLIENT_SECRET,
      }),
    });
    if (!r.ok) {
      console.error("LDA token request failed", r.status);
      return null;
    }
    const j = await r.json();
    return j.access_token ?? null;
  } catch (e) {
    console.error("LDA token error", e);
    return null;
  }
}

// LDA chat sometimes wraps JSON inline with citation markers like [1] [2].
// Strip them before parsing so the JSON shape stays valid.
function stripCitations(s: string): string {
  return s.replace(/\s*\[\d+\]/g, "");
}

function tryParseJSON(raw: string): unknown | null {
  const candidates = [raw, stripCitations(raw)];
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch { /* try next */ }
    const m = c.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch { /* try next */ }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage } = await req.json();
    if (!userMessage || typeof userMessage !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing userMessage in request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = await getLDAToken();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "LDA authentication failed." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const combinedPrompt = `${SYSTEM_INSTRUCTIONS}\n\n--- SACHVERHALT ---\n${userMessage}\n\nAntworte jetzt AUSSCHLIESSLICH mit dem JSON-Objekt im obigen Schema, ohne weitere Erklärung.`;

    // Abort upstream before the platform's idle timeout fires.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 130_000);

    let r: Response;
    try {
      r = await fetch("https://otto-schmidt.legal-data-hub.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [{ role: "user", text: combinedPrompt }],
        }),
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const aborted = err instanceof Error && err.name === "AbortError";
      console.error("assess-breach LDA upstream failure", err);
      return new Response(
        JSON.stringify({
          error: aborted
            ? "LDA assessment timed out. Please retry — the model took too long to respond."
            : "LDA chat request failed before completing.",
        }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    clearTimeout(timeoutId);

    if (!r.ok) {
      const t = await r.text();
      console.error("LDA chat error", r.status, t.slice(0, 400));
      return new Response(
        JSON.stringify({ error: `LDA chat request failed (${r.status}).` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const d = await r.json();
    const content: string = typeof d?.text === "string" ? d.text : "";
    const sources = Array.isArray(d?.sourcedocuments) ? d.sourcedocuments : [];

    const parsed = tryParseJSON(content);
    if (!parsed || typeof parsed !== "object") {
      console.error("LDA returned non-JSON content", content.slice(0, 400));
      return new Response(
        JSON.stringify({
          error: "LDA returned a response that could not be parsed as JSON.",
          raw: content.slice(0, 1000),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        assessment: parsed,
        provider: "lda",
        model: "lda-chat",
        sources,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("assess-breach error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
