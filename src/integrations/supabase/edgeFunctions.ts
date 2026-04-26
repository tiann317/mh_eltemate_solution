// Direct LDA Legal Data Hub calls (assess-breach, query-lda) replacing the
// previous Lovable Cloud edge functions. Credentials are hardcoded for the
// Otto Schmidt hackathon environment.

import type { AIAssessment } from "@/lib/ai/types";

const LDA_CLIENT_ID = "hack01-0fec5330b1ef9f63";
const LDA_CLIENT_SECRET = "41bbeb1670283fc4a73db8dcf2bc3b5d";
const LDA_TOKEN_URL = "https://online.otto-schmidt.de/token";
const LDA_CHAT_URL = "https://otto-schmidt.legal-data-hub.com/api/chat";
const LDA_QNA_URL = "https://otto-schmidt.legal-data-hub.com/api/qna";

// EDSA WP250 rev.01 + DSGVO/NIS2/DORA/CER assessment system prompt.
const SYSTEM_INSTRUCTIONS = `Du bist ein Experte für DSGVO und EU-Datenschutzrecht. Du hilfst Rechts- und Compliance-Teams bei der Reaktion auf Datenschutzverletzungen. Du kennst DSGVO, NIS2-Richtlinie (2022/2555), DORA (2022/2554), CER-Richtlinie (2022/2557) und die EDSA-Leitlinien zur Meldung von Verletzungen des Schutzes personenbezogener Daten (WP250 rev.01).

Aufgaben:
1. Strukturiertes Risk Assessment der beschriebenen Datenpanne
2. Entwurf einer Erstmeldung an die Aufsichtsbehörde (Art. 33 DSGVO)
3. Kurze interne Eskalationsmeldung an CISO/CEO
4. Für JEDE empfohlene technische Maßnahme die spezifische gesetzliche Grundlage angeben
5. Strukturiertes Lawyer-Handoff-Paket für externe Anwälte
6. SECURITY PLAYBOOK: konkrete Schutz-/Eindämmungsmaßnahmen mit Rechtsgrundlage

Regeln:
- Konkrete Vorschriften zitieren: Art. 33, Art. 34, Art. 9, Art. 4 Nr. 12, Art. 32, Art. 5 Abs. 1 lit. f, Art. 30, ErwGr 85, NIS2 Art. 23, DORA Art. 19, CER Art. 15
- EDSA-Leitlinien WP250 rev.01 anwenden
- Bei bestätigten besonderen Kategorien (Art. 9) niemals raten, dass eine Art.-33-Meldung entbehrlich sei
- Antworte AUSSCHLIESSLICH mit gültigem JSON. Kein Text vor oder nach dem JSON. Keine Markdown-Codefences.

JSON-Schema:
{
  "risk_assessment": "...",
  "risk_rating": "low | medium | high | critical",
  "key_gaps": ["..."],
  "notification_draft": "...",
  "internal_alert": "...",
  "lawyer_handoff": "...",
  "recommended_actions": [{ "action": "...", "legal_basis": "DSGVO Art. 32 Abs. 1 lit. b", "rationale": "..." }],
  "security_playbook": [{ "measure": "...", "legal_basis": "...", "priority": "P0 | P1 | P2", "rationale": "..." }],
  "lawyer_packet": {
    "incident_summary": "...",
    "frameworks_triggered": ["GDPR", "NIS2"],
    "active_deadlines": [{ "framework": "GDPR Art.33", "deadline": "72h ab Kenntnis", "status": "running" }],
    "decisions_needed": ["..."],
    "privilege_note": "...",
    "open_questions": ["..."]
  }
}`;

async function fetchAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(LDA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: LDA_CLIENT_ID,
        client_secret: LDA_CLIENT_SECRET,
      }),
    });
    if (!response.ok) return null;
    const json = await response.json();
    return typeof json.access_token === "string" ? json.access_token : null;
  } catch {
    return null;
  }
}

function stripCitations(text: string): string {
  return text.replace(/\s*\[\d+\]/g, "");
}

function tryParseJson(raw: string): unknown | null {
  for (const candidate of [raw, stripCitations(raw)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      const match = candidate.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          /* try next */
        }
      }
    }
  }
  return null;
}

async function assessBreach(userMessage: string) {
  const token = await fetchAccessToken();
  if (!token) {
    return { data: null, error: { message: "LDA authentication failed." } };
  }

  const prompt = `${SYSTEM_INSTRUCTIONS}\n\n--- SACHVERHALT ---\n${userMessage}\n\nAntworte jetzt AUSSCHLIESSLICH mit dem JSON-Objekt im obigen Schema.`;
  const response = await fetch(LDA_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages: [{ role: "user", text: prompt }] }),
  });

  if (!response.ok) {
    return { data: null, error: { message: `LDA chat failed (${response.status}).` } };
  }

  const json = await response.json();
  const content: string = typeof json?.text === "string" ? json.text : "";
  const sources = Array.isArray(json?.sourcedocuments) ? json.sourcedocuments : [];
  const parsed = tryParseJson(content);

  if (!parsed || typeof parsed !== "object") {
    return { data: null, error: { message: "LDA returned unparseable content." } };
  }

  return {
    data: {
      assessment: parsed as AIAssessment,
      provider: "lda",
      model: "lda-chat",
      sources,
    },
    error: null,
  };
}

async function queryLda(prompt: string) {
  if (prompt === "ping") {
    return { data: { answer: "", sources: [] }, error: null };
  }

  const token = await fetchAccessToken();
  if (!token) {
    return { data: null, error: { message: "LDA authentication failed." } };
  }

  const response = await fetch(LDA_QNA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      data_asset: "Beratermodul Datenschutzrecht",
      mode: "attribution",
      filter: [{}],
      prompt,
    }),
  });

  if (!response.ok) {
    return { data: null, error: { message: `LDA qna failed (${response.status}).` } };
  }

  const json = await response.json();
  return {
    data: {
      answer: json.answer ?? "",
      sources: Array.isArray(json.sourcedocuments) ? json.sourcedocuments : [],
    },
    error: null,
  };
}

export async function runEdgeFunction(
  name: string,
  body: unknown,
): Promise<{ data: unknown; error: unknown }> {
  const payload = (body ?? {}) as { prompt?: string; userMessage?: string };

  if (name === "assess-breach") {
    return assessBreach(payload.userMessage ?? "");
  }
  if (name === "query-lda") {
    return queryLda(payload.prompt ?? "");
  }
  return { data: null, error: { message: `Unknown function: ${name}` } };
}
