// All shared types, constants, helpers, API clients for Aegis Notice

export type IncidentType =
  | ""
  | "ransomware"
  | "unauthorised-access"
  | "accidental-disclosure"
  | "insider-threat"
  | "ot-ics"
  | "lost-device"
  | "other";

export type OngoingStatus = "" | "yes" | "partially" | "no" | "unknown";

export type DataCategory =
  | "basic-contact" | "financial" | "credentials"
  | "location" | "health" | "biometric" | "children" | "criminal" | "special-other"
  | "unknown";

export const DANGER_CATEGORIES: DataCategory[] = [
  "location", "health", "biometric", "children", "criminal", "special-other",
];

export type NumAffected = "" | "u50" | "50-500" | "500-5k" | "5k-50k" | "o50k" | "unknown";

export type HarmType =
  | "financial-harm" | "identity" | "physical" | "reputational"
  | "discrimination" | "loss-access" | "none";

export type Sector =
  | "" | "automotive" | "energy" | "lifesciences" | "financial"
  | "consumer" | "telecom" | "transport" | "digital" | "other";

export const NIS2_SECTORS: Sector[] = [
  "automotive", "energy", "lifesciences", "telecom", "transport", "digital",
];

export type Jurisdiction =
  | "" | "AT" | "BE" | "BG" | "HR" | "CY" | "CZ" | "DK" | "EE" | "FI"
  | "FR" | "DE" | "GR" | "HU" | "IE" | "IT" | "LV" | "LT" | "LU" | "MT"
  | "NL" | "PL" | "PT" | "RO" | "SK" | "SI" | "ES" | "SE" | "UK";

export type ThirdParty =
  | "" | "no" | "processor" | "third-controller" | "joint" | "unknown";

export type DpaStatus = "" | "in-place" | "missing" | "outdated" | "unknown";
export type CrossBorder = "" | "yes" | "no" | "unknown";
export type LegalPrivilege = "" | "engaged" | "not-engaged" | "unknown";

export interface FormState {
  // Screen 1 - Discovery
  discoveryTime: string;
  incidentType: IncidentType;
  systemsAffected: string;
  ongoingStatus: OngoingStatus;
  // Screen 2 - Data & people
  dataCategories: DataCategory[];
  numAffected: NumAffected;
  harmTypes: HarmType[];
  // Screen 3 - Organisation
  sector: Sector;
  jurisdiction: Jurisdiction;
  thirdParty: ThirdParty;
  hlClient: boolean;
  // Screen 3.5 - Legal context (conditional)
  controllerName: string;
  dpoContact: string;
  processorName: string;          // when thirdParty = processor
  dpaClauseStatus: DpaStatus;     // when thirdParty = processor / joint
  crossBorder: CrossBorder;       // always
  affectedMemberStates: string;   // when crossBorder = yes
  csirtContact: string;           // when NIS2 sector
  ictThirdParty: string;          // when financial (DORA)
  cerOperator: boolean;           // when energy/transport
  legalPrivilege: LegalPrivilege; // always
  outsideCounsel: string;         // when legalPrivilege = engaged
  retentionBasis: string;         // legal basis for evidence/audit retention
  // Screen 1 follow-ups (immediate, conditional)
  backupsAvailable: "" | "yes" | "no" | "unknown";    // ransomware
  deviceEncrypted: "" | "yes" | "no" | "unknown";     // lost-device
  exfiltrationConfirmed: "" | "yes" | "no" | "unknown"; // unauthorised-access
  // Screen 2 follow-ups
  childrenAgeBand: string;        // children data follow-up
}

export const initialState: FormState = {
  discoveryTime: "",
  incidentType: "",
  systemsAffected: "",
  ongoingStatus: "",
  dataCategories: [],
  numAffected: "",
  harmTypes: [],
  sector: "",
  jurisdiction: "",
  thirdParty: "",
  hlClient: false,
  controllerName: "",
  dpoContact: "",
  processorName: "",
  dpaClauseStatus: "",
  crossBorder: "",
  affectedMemberStates: "",
  csirtContact: "",
  ictThirdParty: "",
  cerOperator: false,
  legalPrivilege: "",
  outsideCounsel: "",
  retentionBasis: "",
  backupsAvailable: "",
  deviceEncrypted: "",
  exfiltrationConfirmed: "",
  childrenAgeBand: "",
};

export const INCIDENT_TYPE_LABELS: Record<Exclude<IncidentType, "">, string> = {
  "ransomware": "Ransomware / encryption attack",
  "unauthorised-access": "Unauthorised data access or exfiltration",
  "accidental-disclosure": "Accidental disclosure (email, misconfiguration)",
  "insider-threat": "Insider threat / misuse",
  "ot-ics": "OT / ICS / SCADA anomaly (no personal data confirmed)",
  "lost-device": "Lost or stolen device / physical media",
  "other": "Other",
};

export const ONGOING_LABELS: Record<Exclude<OngoingStatus, "">, string> = {
  "yes": "Yes — attacker / incident still active",
  "partially": "Partially contained",
  "no": "No — contained",
  "unknown": "Unknown",
};

export const DATA_CATEGORY_LABELS: Record<DataCategory, string> = {
  "basic-contact": "Basic contact details",
  "financial": "Financial / payment data",
  "credentials": "Login credentials / passwords",
  "location": "Precise location / telematics data",
  "health": "Health / medical data",
  "biometric": "Biometric data",
  "children": "Children's data",
  "criminal": "Criminal records / offences",
  "special-other": "Other special category (racial origin, religion, political opinion, trade union)",
  "unknown": "Unknown — still under investigation",
};

export const NUM_AFFECTED_LABELS: Record<Exclude<NumAffected, "">, string> = {
  "u50": "Under 50",
  "50-500": "50 – 500",
  "500-5k": "500 – 5,000",
  "5k-50k": "5,000 – 50,000",
  "o50k": "Over 50,000",
  "unknown": "Unknown",
};

export const HARM_LABELS: Record<HarmType, string> = {
  "financial-harm": "Financial loss / fraud",
  "identity": "Identity theft",
  "physical": "Physical harm or safety risk",
  "reputational": "Reputational damage",
  "discrimination": "Discrimination",
  "loss-access": "Loss of access to services",
  "none": "Minimal or no foreseeable harm",
};

export const SECTOR_LABELS: Record<Exclude<Sector, "">, string> = {
  "automotive": "Automotive / mobility",
  "energy": "Energy / utilities",
  "lifesciences": "Life sciences / healthcare",
  "financial": "Financial services",
  "consumer": "Consumer goods / FMCG",
  "telecom": "Telecommunications",
  "transport": "Transport / logistics",
  "digital": "Digital infrastructure / cloud",
  "other": "Other",
};

export const THIRD_PARTY_LABELS: Record<Exclude<ThirdParty, "">, string> = {
  "no": "No — internal incident only",
  "processor": "Yes — we are the controller; a processor we use suffered the breach",
  "third-controller": "Yes — breach occurred at a third-party controller",
  "joint": "Joint controllers involved",
  "unknown": "Unknown",
};

export const DPA_MAP: Record<Exclude<Jurisdiction, "">, string> = {
  AT: "Austria — DSB",
  BE: "Belgium — APD / GBA",
  BG: "Bulgaria — CPDP",
  HR: "Croatia — AZOP",
  CY: "Cyprus — ODPC",
  CZ: "Czech Republic — ÚOOÚ",
  DK: "Denmark — Datatilsynet",
  EE: "Estonia — AKI",
  FI: "Finland — Tietosuojavaltuutettu",
  FR: "France — CNIL",
  DE: "Germany — BfDI + state DPAs",
  GR: "Greece — HDPA",
  HU: "Hungary — NAIH",
  IE: "Ireland — DPC",
  IT: "Italy — Garante",
  LV: "Latvia — DVI",
  LT: "Lithuania — VDAI",
  LU: "Luxembourg — CNPD",
  MT: "Malta — IDPC",
  NL: "Netherlands — AP",
  PL: "Poland — UODO",
  PT: "Portugal — CNPD",
  RO: "Romania — ANSPDCP",
  SK: "Slovakia — ÚOOÚ SR",
  SI: "Slovenia — IP RS",
  ES: "Spain — AEPD",
  SE: "Sweden — IMY",
  UK: "United Kingdom — ICO (UK GDPR)",
};

// National CSIRT / competent authority for NIS2 notifications, per EU member state.
// Source: ENISA CSIRTs Network registry. Used to populate the CSIRT contact dropdown.
export const NCA_MAP: Record<Exclude<Jurisdiction, "">, string> = {
  AT: "Austria — GovCERT.at / CERT.at",
  BE: "Belgium — CCB / CERT.be",
  BG: "Bulgaria — CERT Bulgaria (govCERT)",
  HR: "Croatia — CERT.hr (CARNet) / ZSIS",
  CY: "Cyprus — CSIRT-CY (DEC)",
  CZ: "Czech Republic — NÚKIB / GovCERT.CZ",
  DK: "Denmark — CFCS (Centre for Cyber Security)",
  EE: "Estonia — CERT-EE (RIA)",
  FI: "Finland — NCSC-FI (Traficom)",
  FR: "France — ANSSI / CERT-FR",
  DE: "Germany — BSI / CERT-Bund",
  GR: "Greece — National CSIRT (Ministry of Digital Governance)",
  HU: "Hungary — NCSC-HU (NBSZ)",
  IE: "Ireland — NCSC-IE",
  IT: "Italy — CSIRT Italia (ACN)",
  LV: "Latvia — CERT.LV",
  LT: "Lithuania — NKSC / CERT-LT",
  LU: "Luxembourg — GOVCERT.LU / CIRCL",
  MT: "Malta — CSIRTMalta",
  NL: "Netherlands — NCSC-NL",
  PL: "Poland — CSIRT NASK / CSIRT GOV / CSIRT MON",
  PT: "Portugal — CERT.PT (CNCS)",
  RO: "Romania — DNSC (Directoratul Național de Securitate Cibernetică)",
  SK: "Slovakia — SK-CERT (NBÚ)",
  SI: "Slovenia — SI-CERT",
  ES: "Spain — INCIBE-CERT / CCN-CERT",
  SE: "Sweden — CERT-SE (MSB)",
  UK: "United Kingdom — NCSC UK (post-Brexit, NIS Regs 2018)",
};

// ---------- helpers ----------

export const fmtTimestamp = (d: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const isNIS2Sector = (s: Sector) => NIS2_SECTORS.includes(s);
export const isFinancial = (s: Sector) => s === "financial";
export const isCERSector = (s: Sector) => s === "energy" || s === "transport";

export const hasAnyDanger = (cats: DataCategory[]) =>
  cats.some(c => DANGER_CATEGORIES.includes(c));

export const hasAnyPersonalData = (cats: DataCategory[]) =>
  cats.length > 0 && !(cats.length === 1 && cats[0] === "unknown");

// ---------- LDA API ----------
//
// Two transport modes:
// 1. Browser-direct: if VITE_LDA_CLIENT_ID + VITE_LDA_CLIENT_SECRET are set in
//    the build, hit Otto Schmidt directly (used for local dev / hackathon demo).
// 2. Edge-function proxy: if those vars are missing, fall back to the
//    Supabase edge function `query-lda` which holds creds server-side.

import { supabase } from "@/integrations/supabase/client";

const LDA_CLIENT_ID = import.meta.env.VITE_LDA_CLIENT_ID as string | undefined;
const LDA_CLIENT_SECRET = import.meta.env.VITE_LDA_CLIENT_SECRET as string | undefined;
const LDA_DIRECT = !!(LDA_CLIENT_ID && LDA_CLIENT_SECRET);

let _ldaTokenCache: { token: string; exp: number } | null = null;

const fetchLDATokenDirect = async (): Promise<string | null> => {
  if (_ldaTokenCache && _ldaTokenCache.exp > Date.now()) return _ldaTokenCache.token;
  try {
    const r = await fetch("https://online.otto-schmidt.de/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: LDA_CLIENT_ID!,
        client_secret: LDA_CLIENT_SECRET!,
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.access_token) return null;
    _ldaTokenCache = { token: j.access_token, exp: Date.now() + 50 * 60 * 1000 };
    return j.access_token;
  } catch {
    return null;
  }
};

export const getLDAToken = async (): Promise<string | null> => {
  if (LDA_DIRECT) return fetchLDATokenDirect();
  try {
    const { data, error } = await supabase.functions.invoke("query-lda", {
      body: { prompt: "ping" },
    });
    if (error || !data || data.error) return null;
    if (data.skipped) return null;
    return "server-managed";
  } catch {
    return null;
  }
};

export interface LDASource {
  source?: string;
  oso_url?: string;
  source_indicator?: string;
  [k: string]: unknown;
}
export interface LDAResult {
  answer: string;
  sources: LDASource[];
  skipped?: string;
}

export const queryLDA = async (_token: string, prompt: string): Promise<LDAResult> => {
  if (LDA_DIRECT) {
    try {
      const token = await fetchLDATokenDirect();
      if (!token) return { answer: "", sources: [], skipped: "LDA token unavailable" };
      const r = await fetch("https://otto-schmidt.legal-data-hub.com/api/qna", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          data_asset: "Beratermodul Datenschutzrecht",
          mode: "attribution",
          filter: [{}],
          prompt,
        }),
      });
      if (!r.ok) return { answer: "", sources: [] };
      const d = await r.json();
      return {
        answer: d.answer ?? "",
        sources: Array.isArray(d.sourcedocuments) ? d.sourcedocuments : [],
      };
    } catch {
      return { answer: "", sources: [] };
    }
  }
  try {
    const { data, error } = await supabase.functions.invoke("query-lda", {
      body: { prompt },
    });
    if (error || !data || data.error) return { answer: "", sources: [] };
    return {
      answer: data.answer ?? "",
      sources: Array.isArray(data.sources) ? data.sources : [],
      skipped: typeof data.skipped === "string" ? data.skipped : undefined,
    };
  } catch {
    return { answer: "", sources: [] };
  }
};

export const LDA_PROMPTS = {
  gdpr: "What are the criteria for determining whether a personal data breach must be notified to a supervisory authority under GDPR Article 33, and when must individuals be notified under Article 34?",
  nis2: "What are the incident notification obligations under NIS2 Directive Article 23 for essential and important entities, including the 24-hour early warning and 72-hour notification deadlines?",
  dora: "What are the ICT-related incident reporting requirements under DORA Article 19, including the timeline for initial, intermediate and final reports to competent authorities?",
};

// ---------- OpenAI ----------

export const OPENAI_SYSTEM_PROMPT = `You are a GDPR and EU data protection law expert assistant helping legal and compliance teams respond to personal data breaches. You have deep knowledge of GDPR, NIS2 Directive (2022/2555), DORA (2022/2554), the CER Directive (2022/2557), and EDPB personal data breach notification guidelines (WP250 rev.01).

Your role is to:
1. Provide a structured risk assessment for the breach described
2. Draft an initial Art.33 GDPR supervisory authority notification letter
3. Draft a short internal escalation alert for senior leadership (CISO / CEO)
4. For EVERY recommended technical action, attach the specific statutory legal basis that justifies and/or compels that action — so the legal team can audit the technical response. This is mandatory: tech teams must never act without an auditable legal anchor.
5. Build a structured lawyer handoff packet for outside counsel.

Rules:
- Always cite specific legal provisions: Art.33, Art.34, Art.9, Art.4(12), Art.32, Art.5(1)(f), Art.30, Recital 85, NIS2 Art.23, DORA Art.19, CER Art.15
- For each recommended action, choose the most precise primary citation (e.g. "GDPR Art.32(1)(b)" for confidentiality restoration; "GDPR Art.33(5)" for documenting facts; "NIS2 Art.21" for cybersecurity risk-management measures)
- Apply EDPB Guidelines on personal data breach notification (WP250 rev.01)
- Never advise that Art.33 notification is not required where Art.9 special category data is confirmed
- Flag what additional information gaps would change your assessment
- If facts are uncertain, acknowledge uncertainty — do not fabricate certainty
- Language must be professional and suitable for review by a qualified lawyer
- Return ONLY valid JSON in the exact schema below. No text outside the JSON object.

Return this exact JSON schema — no text outside the JSON:
{
  "risk_assessment": "3-4 sentences analysing risk to individuals, citing provisions",
  "key_gaps": ["gap 1", "gap 2"],
  "notification_draft": "Full Art.33 notification letter text, formal",
  "internal_alert": "5-6 line internal escalation alert for CISO/CEO, plain language",
  "lawyer_handoff": "6-8 line plain-text structured handoff summary for outside counsel",
  "recommended_actions": [
    { "action": "immediate technical action 1", "legal_basis": "GDPR Art.32(1)(b)", "rationale": "one-line why this provision compels/permits this action" },
    { "action": "action 2", "legal_basis": "GDPR Art.33(5)", "rationale": "..." },
    { "action": "action 3", "legal_basis": "NIS2 Art.21(2)(c)", "rationale": "..." },
    { "action": "action 4", "legal_basis": "GDPR Art.5(1)(f)", "rationale": "..." }
  ],
  "lawyer_packet": {
    "incident_summary": "1-2 line factual summary",
    "frameworks_triggered": ["GDPR", "NIS2"],
    "active_deadlines": [{ "framework": "GDPR Art.33", "deadline": "72h from discovery", "status": "running" }],
    "decisions_needed": ["confirm Art.34 individual notification trigger", "approve DPA notification draft"],
    "privilege_note": "one line on legal privilege posture given inputs",
    "open_questions": ["question 1", "question 2"]
  }
}`;

export interface RecommendedAction {
  action: string;
  legal_basis: string;
  rationale: string;
}

export interface LawyerPacket {
  incident_summary: string;
  frameworks_triggered: string[];
  active_deadlines: { framework: string; deadline: string; status: string }[];
  decisions_needed: string[];
  privilege_note: string;
  open_questions: string[];
}

export interface SecurityMeasure {
  measure: string;
  legal_basis: string;
  priority: string;
  rationale: string;
}

export interface AIAssessment {
  risk_assessment: string;
  risk_rating?: string;
  key_gaps: string[];
  notification_draft: string;
  internal_alert: string;
  lawyer_handoff: string;
  recommended_actions: (RecommendedAction | string)[];
  security_playbook?: SecurityMeasure[];
  lawyer_packet?: LawyerPacket;
}

export const normalizeAction = (a: RecommendedAction | string): RecommendedAction =>
  typeof a === "string"
    ? { action: a, legal_basis: "GDPR Art.32(1)(b)", rationale: "Default: security of processing obligation." }
    : a;

const OPENAI_KEY = "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";

export const callOpenAI = async (userMessage: string): Promise<AIAssessment | null> => {
  console.log("[callOpenAI] starting, key present:", !!OPENAI_KEY, "len:", OPENAI_KEY?.length);
  // Browser-direct path (local dev / hackathon demo).
  if (OPENAI_KEY) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0.2,
          messages: [
            { role: "system", content: OPENAI_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      });
      console.log("[callOpenAI] response status:", r.status);
      if (!r.ok) {
        console.error("OpenAI direct call failed", r.status, await r.text());
        return null;
      }
      const d = await r.json();
      const content: string = d?.choices?.[0]?.message?.content ?? "";
      console.log("[callOpenAI] got content length:", content.length);
      try {
        return JSON.parse(content) as AIAssessment;
      } catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (m) {
          try { return JSON.parse(m[0]) as AIAssessment; } catch { /* fall through */ }
        }
        console.error("[callOpenAI] JSON parse failed", content.slice(0, 200));
        return null;
      }
    } catch (e) {
      console.error("callOpenAI direct exception", e);
      return null;
    }
  }

  // Edge-function fallback.
  try {
    const { data, error } = await supabase.functions.invoke("assess-breach", {
      body: { userMessage },
    });
    if (error || !data || data.error || !data.assessment) {
      console.error("assess-breach error", error || data?.error);
      return null;
    }
    return data.assessment as AIAssessment;
  } catch (e) {
    console.error("callOpenAI exception", e);
    return null;
  }
};

// ---------- Regulatory deadline helpers ----------

export interface RegDeadline {
  framework: string;
  label: string;
  hours: number;
  applies: boolean;
}

export const getDeadlines = (s: FormState): RegDeadline[] => {
  const out: RegDeadline[] = [];
  out.push({
    framework: "GDPR Art.33",
    label: "DPA notification (72h)",
    hours: 72,
    applies: hasAnyPersonalData(s.dataCategories),
  });
  if (hasAnyDanger(s.dataCategories) || s.numAffected === "5k-50k" || s.numAffected === "o50k") {
    out.push({ framework: "GDPR Art.34", label: "Individual notification (without undue delay)", hours: 72, applies: true });
  }
  if (isNIS2Sector(s.sector)) {
    out.push({ framework: "NIS2 Art.23", label: "Early warning (24h)", hours: 24, applies: true });
    out.push({ framework: "NIS2 Art.23", label: "Incident notification (72h)", hours: 72, applies: true });
  }
  if (isFinancial(s.sector)) {
    out.push({ framework: "DORA Art.19", label: "Initial report (4h after classification)", hours: 4, applies: true });
  }
  if (isCERSector(s.sector) && s.cerOperator) {
    out.push({ framework: "CER Art.15", label: "Incident notification (24h)", hours: 24, applies: true });
  }
  return out;
};

export const computeRiskRating = (s: FormState): "low" | "medium" | "high" | "critical" => {
  const danger = hasAnyDanger(s.dataCategories);
  const highVol = s.numAffected === "5k-50k" || s.numAffected === "o50k";
  const physical = s.harmTypes.includes("physical");
  if (physical || (danger && highVol)) return "critical";
  if (danger || highVol) return "high";
  if (hasAnyPersonalData(s.dataCategories)) return "medium";
  return "low";
};

export const buildUserMessage = (s: FormState, firedAlerts: { title: string; cite: string }[]): string => {
  const list = (arr: string[]) => (arr.length ? arr.join(", ") : "none");
  return `Breach incident report — please assess and draft notifications:

DISCOVERY
- Time of discovery: ${s.discoveryTime || "not recorded"}
- Incident type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "not specified"}
- Systems affected: ${s.systemsAffected || "not specified"}
- Incident status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "not specified"}

DATA & PEOPLE
- Data categories selected: ${list(s.dataCategories.map(c => DATA_CATEGORY_LABELS[c]))}
- Number of individuals affected: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "not specified"}
- Potential harm types: ${list(s.harmTypes.map(h => HARM_LABELS[h]))}

ORGANISATION
- Sector: ${s.sector ? SECTOR_LABELS[s.sector] : "not specified"}
- Lead jurisdiction / DPA: ${s.jurisdiction ? DPA_MAP[s.jurisdiction] : "not specified"}
- Third party involvement: ${s.thirdParty ? THIRD_PARTY_LABELS[s.thirdParty] : "not specified"}

LEGAL CONTEXT
- Controller: ${s.controllerName || "not provided"}
- DPO contact: ${s.dpoContact || "not provided"}
- Processor (if any): ${s.processorName || "n/a"}
- DPA (Art.28) clause status: ${s.dpaClauseStatus || "not assessed"}
- Cross-border processing: ${s.crossBorder || "not assessed"}
- Affected EU member states: ${s.affectedMemberStates || "n/a"}
- CSIRT / NCA contact (NIS2): ${s.csirtContact || "n/a"}
- ICT third-party provider (DORA): ${s.ictThirdParty || "n/a"}
- CER critical-entity operator: ${s.cerOperator ? "yes" : "no"}
- Legal privilege engaged: ${s.legalPrivilege || "not specified"}
- Outside counsel: ${s.outsideCounsel || "n/a"}
- Audit/evidence retention basis stated by org: ${s.retentionBasis || "n/a"}

DETERMINISTIC RULE ENGINE — ALERTS ALREADY TRIGGERED:
${firedAlerts.length ? firedAlerts.map(a => `• ${a.title} — ${a.cite}`).join("\n") : "• none"}

Please return your JSON response only. Every recommended_actions item MUST include action, legal_basis (precise citation) and one-line rationale.`;
};

// ---------- Notification draft generation ----------
// Builds compliant notification drafts for each framework, using AI output
// when available and falling back to statutory boilerplate otherwise.

export type NotificationFramework =
  | "gdpr-art33"        // DPA notification (72h)
  | "gdpr-art34"        // Individual notification
  | "nis2-early-warning" // 24h
  | "nis2-72h"          // 72h
  | "dora-initial"      // 4h
  | "cer-art15"         // 24h
  | "internal-legal-counsel" // tailored brief to in-house / outside counsel
  | "internal-escalation";

export interface NotificationDraft {
  framework: NotificationFramework;
  label: string;
  authority: string;
  recipientPlaceholder: string;
  subject: string;
  body: string;
}

const fallbackArt33 = (s: FormState) => `Dear Sir/Madam,

In accordance with Article 33 of the General Data Protection Regulation (Regulation (EU) 2016/679, "GDPR"), we are notifying ${s.jurisdiction ? DPA_MAP[s.jurisdiction] : "the competent supervisory authority"} of a personal data breach.

1. Nature of the breach
   - Discovered on: ${s.discoveryTime || "[discovery time]"}
   - Incident type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[incident type]"}
   - Systems affected: ${s.systemsAffected || "[systems]"}
   - Containment status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}

2. Categories and approximate number of data subjects concerned
   - Categories: ${s.dataCategories.length ? s.dataCategories.map(c => DATA_CATEGORY_LABELS[c]).join("; ") : "[under investigation]"}
   - Approximate number affected: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "[under investigation]"}

3. Likely consequences of the breach
   - ${s.harmTypes.length ? s.harmTypes.map(h => HARM_LABELS[h]).join("; ") : "Under assessment"}

4. Measures taken or proposed
   - Containment, forensic investigation and evidence preservation are underway.
   - This notification is interim; further information will follow under Article 33(4).

5. Contact point
   - Controller: ${s.controllerName || "[controller name]"}
   - Data Protection Officer: ${s.dpoContact || "[DPO contact]"}

We acknowledge our continuing obligations under Articles 33(3), 33(4) and 33(5) GDPR.

Yours faithfully,
${s.controllerName || "[Controller]"}`;

const fallbackArt34 = (s: FormState) => `Dear data subject,

We are writing to inform you, in accordance with Article 34 of the GDPR, that we have identified a personal data breach affecting your personal data.

What happened
On ${s.discoveryTime || "[date]"} we discovered ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType].toLowerCase() : "an incident"} affecting ${s.systemsAffected || "one of our systems"}.

What information was involved
${s.dataCategories.length ? s.dataCategories.map(c => `• ${DATA_CATEGORY_LABELS[c]}`).join("\n") : "• Under investigation"}

What we are doing
We have engaged our security team and, where appropriate, law enforcement and external counsel. We have notified ${s.jurisdiction ? DPA_MAP[s.jurisdiction] : "the competent supervisory authority"}.

What you can do
${s.dataCategories.includes("credentials") ? "• Reset any password you used on the affected service and any service where you reused that password.\n" : ""}${s.dataCategories.includes("financial") ? "• Monitor your bank/card statements and alert your card issuer to any unrecognised activity.\n" : ""}• Be alert to phishing communications referencing this incident.

Contact
If you have questions you may contact our Data Protection Officer at ${s.dpoContact || "[DPO contact]"}.

We sincerely regret this incident.

${s.controllerName || "[Controller]"}`;

const fallbackNis2Early = (s: FormState) => `EARLY WARNING — NIS2 Article 23(4)(a)

Reporting entity: ${s.controllerName || "[entity]"}
Sector: ${s.sector ? SECTOR_LABELS[s.sector] : "[sector]"}
Time of detection: ${s.discoveryTime || "[time]"}

Initial assessment:
- Suspected significant incident affecting ${s.systemsAffected || "[systems]"}.
- Suspected to be caused by unlawful or malicious acts: under assessment.
- May have a cross-border impact: ${s.crossBorder === "yes" ? `yes — ${s.affectedMemberStates || "member states under assessment"}` : s.crossBorder === "no" ? "no" : "under assessment"}.

A formal incident notification under Article 23(4)(b) will follow within 72 hours.

Contact: ${s.dpoContact || s.csirtContact || "[contact]"}`;

const fallbackNis272 = (s: FormState) => `INCIDENT NOTIFICATION — NIS2 Article 23(4)(b)

Reporting entity: ${s.controllerName || "[entity]"}
Sector: ${s.sector ? SECTOR_LABELS[s.sector] : "[sector]"}

1. Update on the early warning
   - Time of detection: ${s.discoveryTime || "[time]"}
   - Current containment status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}

2. Initial assessment of the incident
   - Severity / impact: ${computeRiskRating(s)} risk rating (deterministic).
   - Affected services: ${s.systemsAffected || "[systems]"}
   - Cross-border impact: ${s.crossBorder === "yes" ? s.affectedMemberStates || "yes — member states under assessment" : s.crossBorder || "under assessment"}.

3. Indicators of compromise
   - To be supplied as available.

4. Mitigation measures
   - Containment, forensic investigation, log preservation and stakeholder notification underway.

A final report under Article 23(4)(c) will follow within one month.

Contact: ${s.csirtContact || s.dpoContact || "[contact]"}`;

const fallbackDoraInitial = (s: FormState) => `INITIAL INCIDENT REPORT — DORA Article 19(4)(a)

Financial entity: ${s.controllerName || "[entity]"}
Classification: Major ICT-related incident (preliminary)
Time of detection: ${s.discoveryTime || "[time]"}
Time of classification as major: [to be confirmed]

1. Incident description
   - Type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[type]"}
   - Affected ICT services / functions: ${s.systemsAffected || "[systems]"}
   - ICT third-party provider involvement: ${s.ictThirdParty || "under assessment"}

2. Initial impact
   - Containment status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}
   - Customer / market impact: under assessment.
   - Cross-border impact: ${s.crossBorder === "yes" ? s.affectedMemberStates || "yes" : s.crossBorder || "under assessment"}.

3. Immediate response
   - Crisis-management procedures activated under DORA Art.17.
   - ICT-related incident management process initiated.

Intermediate and final reports will follow under Article 19(4)(b) and (c).

Contact: ${s.dpoContact || "[contact]"}`;

const fallbackCer = (s: FormState) => `CRITICAL ENTITY INCIDENT NOTIFICATION — CER Directive Art.15

Critical entity: ${s.controllerName || "[entity]"}
Sector: ${s.sector ? SECTOR_LABELS[s.sector] : "[sector]"}
Time of detection: ${s.discoveryTime || "[time]"}

1. Incident
   - Description: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[type]"}, affecting ${s.systemsAffected || "[essential service component]"}.
   - Containment status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}.

2. Disruption to essential services
   - Significant disruption / potential for significant disruption: under assessment.
   - Affected user base: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "[under assessment]"}.

3. Cross-border impact
   - ${s.crossBorder === "yes" ? s.affectedMemberStates || "Yes — member states under assessment" : s.crossBorder || "Under assessment"}.

4. Mitigation
   - Resilience measures activated; coordination with national competent authority initiated.

Contact: ${s.csirtContact || s.dpoContact || "[contact]"}`;

const internalEscalation = (s: FormState, ai?: AIAssessment | null) => ai?.internal_alert || `INTERNAL ESCALATION — ${computeRiskRating(s).toUpperCase()} RISK INCIDENT

Detected: ${s.discoveryTime || "[time]"}
Type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[type]"}
Systems: ${s.systemsAffected || "[systems]"}
Approx. data subjects affected: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "[under assessment]"}

Frameworks engaged: ${[
  hasAnyPersonalData(s.dataCategories) ? "GDPR" : null,
  isNIS2Sector(s.sector) ? "NIS2" : null,
  isFinancial(s.sector) ? "DORA" : null,
  isCERSector(s.sector) && s.cerOperator ? "CER" : null,
].filter(Boolean).join(", ") || "Under assessment"}.

Active deadlines: see incident workspace.
Decision needed: senior leadership sign-off on regulatory notifications before transmission.`;

// Tailors a one-paragraph "what kind of breach this is" framing for legal
// counsel based on the incident type. Used inside the internal-counsel brief
// so outside / in-house lawyers see the right legal angle immediately.
const incidentTypeLegalAngle = (s: FormState): string => {
  switch (s.incidentType) {
    case "ransomware":
      return `Ransomware / encryption attack — primary legal exposure: GDPR Art.32(1)(b)-(c) (confidentiality + restoration), Art.33 (personal-data breach where decryption key not held), and NIS2 Art.23 (significant incident). Confirm whether ransom payment is contemplated — sanctions / OFAC and Art.6 lawful basis questions arise.`;
    case "unauthorised-access":
      return `Unauthorised access / data exfiltration — primary legal exposure: GDPR Art.4(12) confidentiality breach, Art.33 + Art.34 if exfiltration confirmed, and Art.32 organisational measures review. Privilege over forensic findings should be considered now (legal-advice privilege under outside counsel instruction).`;
    case "accidental-disclosure":
      return `Accidental disclosure (email / misconfiguration) — primary legal exposure: GDPR Art.5(1)(f) integrity & confidentiality, Art.32 organisational measures, Art.33 notification trigger if risk to individuals not "unlikely". Recall / takedown evidence should be preserved.`;
    case "insider-threat":
      return `Insider threat / misuse — primary legal exposure: GDPR Art.5(1)(f) and Art.32(4) staff confidentiality controls, Art.33 notification, employment-law and works-council coordination, and potential criminal complaint (StGB §§ 202a/203 in Germany).`;
    case "ot-ics":
      return `OT/ICS/SCADA anomaly — primary legal exposure: NIS2 Art.23 significant incident notification, CER Art.15 if critical entity, and DORA Art.19 if financial. GDPR may not be triggered if no personal data confirmed — flag this clearly.`;
    case "lost-device":
      return `Lost / stolen device or media — primary legal exposure: GDPR Art.33 (presumed breach unless data demonstrably inaccessible), Art.32 encryption posture, Art.34 if device unencrypted and risk high. Encryption status is dispositive for the Art.34 risk threshold.`;
    case "other":
    case "":
    default:
      return `Incident classification pending — apply default analysis: GDPR Art.4(12) (any personal data?), Art.32 (security adequacy), Art.33 (72h notification clock), and any sectoral overlay (NIS2 / DORA / CER) per the controller's sector.`;
  }
};

const internalLegalCounselDraft = (s: FormState, ai: AIAssessment | null): string => {
  const personal = hasAnyPersonalData(s.dataCategories);
  const danger = hasAnyDanger(s.dataCategories);
  const frameworks = [
    personal ? "GDPR" : null,
    isNIS2Sector(s.sector) ? "NIS2" : null,
    isFinancial(s.sector) ? "DORA" : null,
    isCERSector(s.sector) && s.cerOperator ? "CER" : null,
  ].filter(Boolean).join(", ") || "Under assessment";

  const decisions = ai?.lawyer_packet?.decisions_needed?.length
    ? ai.lawyer_packet.decisions_needed.map(d => `   • ${d}`).join("\n")
    : "   • Confirm Art.33 notification trigger\n   • Confirm Art.34 individual-notification trigger\n   • Confirm legal-privilege posture over forensic workstream";

  return `PRIVILEGED & CONFIDENTIAL — PREPARED IN CONTEMPLATION OF LEGAL ADVICE
TO:      ${s.outsideCounsel || "[Outside counsel / in-house legal]"}
FROM:    ${s.dpoContact || s.controllerName || "[DPO / Controller]"}
SUBJECT: ${computeRiskRating(s).toUpperCase()} incident — legal review request — ${s.controllerName || "[entity]"}
DATE:    ${new Date().toISOString()}

1. Incident framing
${incidentTypeLegalAngle(s)}

2. Factual snapshot
   • Discovered: ${s.discoveryTime || "[discovery time]"}
   • Type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[type]"}
   • Systems: ${s.systemsAffected || "[systems]"}
   • Containment: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}
   • Data categories: ${s.dataCategories.length ? s.dataCategories.map(c => DATA_CATEGORY_LABELS[c]).join("; ") : "under investigation"}
   • Approx. data subjects: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "under investigation"}
   • Special-category / high-risk data present: ${danger ? "YES" : "no / unknown"}
   • Cross-border: ${s.crossBorder === "yes" ? (s.affectedMemberStates || "yes — member states tbc") : (s.crossBorder || "under assessment")}
   • Jurisdiction (lead DPA): ${s.jurisdiction ? DPA_MAP[s.jurisdiction] : "[lead DPA]"}

3. Frameworks engaged
   ${frameworks}

4. Decisions required from counsel
${decisions}

5. Privilege & retention posture
   • Privilege: ${s.legalPrivilege || "not yet asserted"} ${s.outsideCounsel ? `(under instruction to ${s.outsideCounsel})` : ""}
   • Evidence/audit-log retention basis: ${s.retentionBasis || "GDPR Art.6(1)(c) + Art.33(5) — documentation of breach"}

6. Counsel handoff context
${ai?.lawyer_handoff || ai?.lawyer_packet?.incident_summary || "Awaiting AI assessment — facts above are the working record."}

7. Requested response
   Please confirm (a) the notification posture for each engaged framework, (b) whether legal-advice privilege should be formally asserted over the forensic workstream from this point forward, and (c) any external-counsel instructions you wish to issue before the next statutory deadline elapses.

— End of brief —`;
};

export function buildNotificationDrafts(s: FormState, ai: AIAssessment | null): NotificationDraft[] {
  const drafts: NotificationDraft[] = [];
  const personal = hasAnyPersonalData(s.dataCategories);
  const dpa = s.jurisdiction ? DPA_MAP[s.jurisdiction] : "Lead supervisory authority";
  const nca = s.jurisdiction ? (NCA_MAP[s.jurisdiction] || "National competent authority") : "National competent authority";

  // Always include a tailored brief to internal/outside legal counsel — this is
  // the first thing the AI flags as needing a human lawyer's eyes on.
  drafts.push({
    framework: "internal-legal-counsel",
    label: "Internal legal counsel brief — privileged",
    authority: s.outsideCounsel || "Internal / outside legal counsel",
    recipientPlaceholder: "legal@, outside-counsel@",
    subject: `[PRIVILEGED] ${computeRiskRating(s).toUpperCase()} incident — legal review — ${s.controllerName || "[entity]"}`,
    body: internalLegalCounselDraft(s, ai),
  });

  if (personal) {
    drafts.push({
      framework: "gdpr-art33",
      label: "GDPR Art.33 — Supervisory authority notification (72h)",
      authority: dpa,
      recipientPlaceholder: "DPA breach-notification portal email",
      subject: `Personal data breach notification — Art.33 GDPR — ${s.controllerName || "[controller]"}`,
      body: ai?.notification_draft || fallbackArt33(s),
    });
  }
  if (hasAnyDanger(s.dataCategories) || s.numAffected === "5k-50k" || s.numAffected === "o50k") {
    drafts.push({
      framework: "gdpr-art34",
      label: "GDPR Art.34 — Notification to affected individuals",
      authority: "Affected data subjects",
      recipientPlaceholder: "Distribution list / mail merge target",
      subject: `Important notice about your personal data — ${s.controllerName || "[controller]"}`,
      body: fallbackArt34(s),
    });
  }
  if (isNIS2Sector(s.sector)) {
    drafts.push({
      framework: "nis2-early-warning",
      label: "NIS2 Art.23(4)(a) — Early warning (24h)",
      authority: nca,
      recipientPlaceholder: "CSIRT / NCA reporting endpoint",
      subject: `NIS2 Early warning — ${s.controllerName || "[entity]"}`,
      body: fallbackNis2Early(s),
    });
    drafts.push({
      framework: "nis2-72h",
      label: "NIS2 Art.23(4)(b) — Incident notification (72h)",
      authority: nca,
      recipientPlaceholder: "CSIRT / NCA reporting endpoint",
      subject: `NIS2 Incident notification — ${s.controllerName || "[entity]"}`,
      body: fallbackNis272(s),
    });
  }
  if (isFinancial(s.sector)) {
    drafts.push({
      framework: "dora-initial",
      label: "DORA Art.19 — Initial report (4h after classification)",
      authority: "Financial competent authority",
      recipientPlaceholder: "Competent authority secure portal",
      subject: `DORA — Initial major ICT incident report — ${s.controllerName || "[entity]"}`,
      body: fallbackDoraInitial(s),
    });
  }
  if (isCERSector(s.sector) && s.cerOperator) {
    drafts.push({
      framework: "cer-art15",
      label: "CER Art.15 — Incident notification (24h)",
      authority: nca,
      recipientPlaceholder: "CER competent authority",
      subject: `CER incident notification — ${s.controllerName || "[entity]"}`,
      body: fallbackCer(s),
    });
  }
  drafts.push({
    framework: "internal-escalation",
    label: "Internal escalation — CISO / CEO",
    authority: "Senior leadership",
    recipientPlaceholder: "ciso@, ceo@",
    subject: `[${computeRiskRating(s).toUpperCase()}] Incident escalation — ${s.controllerName || "[entity]"}`,
    body: internalEscalation(s, ai),
  });
  return drafts;
}

export const FRAMEWORK_LABELS: Record<NotificationFramework, string> = {
  "gdpr-art33": "GDPR Art.33",
  "gdpr-art34": "GDPR Art.34",
  "nis2-early-warning": "NIS2 24h",
  "nis2-72h": "NIS2 72h",
  "dora-initial": "DORA 4h",
  "cer-art15": "CER Art.15",
  "internal-legal-counsel": "Legal counsel",
  "internal-escalation": "Internal",
};

// ---------- Immediate technical action playbook ----------
// Two-track guidance shown upfront on the incident page:
//   1. GENERAL audit-readiness measures every responder must take regardless
//      of the incident's nature, anchored to ISO/IEC 27001/27035/27037 and
//      GDPR Art.5(2) accountability.
//   2. INCIDENT-SPECIFIC technical containment steps tailored to the
//      classified incident type, anchored to GDPR Art.32 + sectoral law.
// Both lists are static so they render before the AI assessment returns —
// responders never have to wait on the model to start acting.

export interface TechnicalActionItem {
  action: string;
  legal_basis: string;
  rationale: string;
}

export const GENERAL_AUDITABILITY_ACTIONS: TechnicalActionItem[] = [
  {
    action: "Open a dedicated incident ticket and start a contemporaneous timeline (UTC, append-only).",
    legal_basis: "GDPR Art.33(5) · ISO/IEC 27035-2 §6.4",
    rationale: "Art.33(5) requires the controller to document any breach (facts, effects, remedial action) — a written timeline is the minimum evidence.",
  },
  {
    action: "Preserve volatile evidence (RAM, network state, active sessions) before any remediation that would alter it.",
    legal_basis: "ISO/IEC 27037 §5.3 · GDPR Art.5(2) accountability",
    rationale: "Forensic admissibility requires capturing volatile data first; remediation steps that overwrite it must be deferred or hashed beforehand.",
  },
  {
    action: "Hash and chain-of-custody all collected logs, snapshots and disk images (SHA-256, signed manifest).",
    legal_basis: "ISO/IEC 27037 §6.7 (chain of custody)",
    rationale: "Without a documented chain of custody, evidence may be inadmissible in regulatory or civil proceedings.",
  },
  {
    action: "Lock log-rotation / retention on all in-scope systems for the duration of the incident.",
    legal_basis: "GDPR Art.5(1)(e) + Art.6(1)(c) · ISO/IEC 27001 A.8.15",
    rationale: "Default retention windows can destroy evidence within hours — pause rotation under a documented lawful basis.",
  },
  {
    action: "Restrict the responder Slack/Teams channel and instruct participants that comms may be discoverable; route legal analysis through counsel.",
    legal_basis: "Legal-advice privilege · GDPR Art.6(1)(f) legitimate interest",
    rationale: "Loose responder chatter often becomes the single most damaging exhibit in a regulatory investigation.",
  },
  {
    action: "Notify the DPO and information-security manager in writing within 1 hour of detection.",
    legal_basis: "GDPR Art.38(1) · ISO/IEC 27001 A.5.24",
    rationale: "The DPO must be 'involved, properly and in a timely manner' in all data-protection issues — late notification is itself a finding.",
  },
];

export function getIncidentTypeTechnicalActions(s: FormState): TechnicalActionItem[] {
  switch (s.incidentType) {
    case "ransomware":
      return [
        { action: "Isolate affected hosts at the network layer (do NOT power off — preserves RAM for forensics).", legal_basis: "GDPR Art.32(1)(b) · ISO/IEC 27035 §7.3", rationale: "Containment without losing volatile evidence is the standard for ransomware response." },
        { action: "Capture a sample of the ransom note, encrypted file headers and any C2 indicators; do NOT engage the attacker.", legal_basis: "ISO/IEC 27037 §6 · EU sanctions regime", rationale: "Communicating with the attacker may breach EU/OFAC sanctions and prejudice law-enforcement cooperation." },
        { action: `Confirm backup integrity${s.backupsAvailable === "yes" ? " (backups reported available — verify they are offline / immutable and uninfected before restore)" : " — backups not yet confirmed; treat restore as untrusted"}.`, legal_basis: "GDPR Art.32(1)(c) · NIS2 Art.21(2)(d)", rationale: "Restoration capability is an explicit Art.32(1)(c) requirement; restoring from a compromised backup re-infects the estate." },
        { action: "Engage law enforcement (national cybercrime unit) before any decision on ransom payment.", legal_basis: "NIS2 Art.23(1) · national criminal-procedure law", rationale: "Most EU member states require or strongly encourage law-enforcement involvement; payment without engagement carries criminal exposure." },
      ];
    case "unauthorised-access":
      return [
        { action: "Force credential rotation for all identities with access to the affected systems (including service accounts and API keys).", legal_basis: "GDPR Art.32(1)(b) · ISO/IEC 27001 A.5.16", rationale: "Stolen credentials are the most common reuse vector; rotate before scoping is complete." },
        { action: `Determine whether data exfiltration is confirmed${s.exfiltrationConfirmed ? ` (current status: ${s.exfiltrationConfirmed})` : ""} — review egress logs, DLP alerts and cloud audit trails.`, legal_basis: "GDPR Art.33(1) (risk threshold) · Art.34(1)", rationale: "Confirmed exfiltration shifts the Art.34 individual-notification analysis to a near-mandatory posture." },
        { action: "Snapshot affected hosts and capture full packet capture at the egress edge for the relevant window.", legal_basis: "ISO/IEC 27037 §5.3", rationale: "Without packet/egress evidence the scope of exfiltration cannot be defended in a regulatory investigation." },
        { action: "Revoke active sessions (SSO, VPN, OAuth tokens) for the affected user population.", legal_basis: "GDPR Art.32(1)(b) · ISO/IEC 27001 A.8.5", rationale: "Token-based persistence frequently survives a password reset; revocation is required to terminate the intrusion." },
      ];
    case "accidental-disclosure":
      return [
        { action: "Issue immediate recall / takedown requests (email recall, public-share revocation, search-engine de-indexing where applicable).", legal_basis: "GDPR Art.5(1)(f) · Art.32(1)(b)", rationale: "Mitigating exposure narrows the Art.34 risk assessment and is required as a 'measure to address the breach'." },
        { action: "Preserve message metadata, recipient list and read-receipts before deleting any copies under your control.", legal_basis: "GDPR Art.33(5) · ISO/IEC 27037", rationale: "You must be able to prove who saw what, when — deletion before preservation destroys the only evidence." },
        { action: "Contact downstream recipients in writing instructing deletion and seeking confirmation.", legal_basis: "GDPR Art.5(1)(f) integrity & confidentiality", rationale: "A documented deletion request from each recipient is the strongest mitigation evidence available." },
        { action: "Review the misconfiguration / process that caused disclosure and freeze the underlying change pipeline pending root-cause.", legal_basis: "GDPR Art.32(1)(d) · ISO/IEC 27001 A.8.32", rationale: "Recurrence within 72h would aggravate the regulator's view of the controller's Art.32 posture." },
      ];
    case "insider-threat":
      return [
        { action: "Suspend the suspected individual's access (logical and physical) without alerting them, in coordination with HR / works council.", legal_basis: "GDPR Art.32(4) · national employment law", rationale: "Tipping off a malicious insider destroys evidence; suspension must be documented and coordinated with employment counsel." },
        { action: "Preserve endpoint, mailbox and DLP records for the suspected user under legal hold.", legal_basis: "ISO/IEC 27037 · GDPR Art.5(2)", rationale: "Endpoint data on a current employee is sensitive — process it under a documented legal hold and lawful basis." },
        { action: "Prepare a criminal-complaint package in parallel with the regulatory workstream (e.g. StGB §§ 202a/203 in Germany).", legal_basis: "National criminal-procedure law · GDPR Art.6(1)(c)/(f)", rationale: "Filing a criminal complaint protects the controller's position and may affect privilege over the forensic workstream." },
        { action: "Restrict communication about the matter to a named investigation team; everyone else 'need to know' only.", legal_basis: "Confidentiality / legal-advice privilege", rationale: "Insider-threat investigations are the highest-risk surface for premature disclosure and defamation claims." },
      ];
    case "ot-ics":
      return [
        { action: "Coordinate any containment action with the OT/ICS engineering team — do NOT apply IT-style isolation without safety review.", legal_basis: "NIS2 Art.21(2) · IEC 62443-3-3", rationale: "An IT-style network cut on an OT segment can cause physical-process safety incidents." },
        { action: "Capture historian, PLC and HMI logs to immutable storage before any reset.", legal_basis: "ISO/IEC 27037 · IEC 62443-2-1", rationale: "OT logs roll over rapidly and are the only artefact of process-side anomalies." },
        { action: "Notify the national CSIRT under NIS2 Art.23(4)(a) within 24h of awareness.", legal_basis: "NIS2 Art.23(4)(a)", rationale: "OT incidents at essential / important entities are the prototypical NIS2 early-warning trigger." },
        { action: "Confirm whether any personal data was incidentally affected (engineering-station mailboxes, RDP accounts) — if yes, the GDPR track engages in addition.", legal_basis: "GDPR Art.4(12)", rationale: "OT incidents often have a hidden GDPR overlay through engineering workstations." },
      ];
    case "lost-device":
      return [
        { action: `Confirm device-encryption status and key-management posture${s.deviceEncrypted ? ` (current status: ${s.deviceEncrypted})` : ""}.`, legal_basis: "GDPR Art.32(1)(a) · Art.34(3)(a)", rationale: "Strong encryption with the key not exposed is the dispositive factor that can disapply Art.34 individual notification." },
        { action: "Trigger remote wipe / token revocation for the device's identity and any cached credentials.", legal_basis: "GDPR Art.32(1)(b) · ISO/IEC 27001 A.7.9", rationale: "Even an encrypted device with cached app sessions can leak data if the session tokens are not revoked." },
        { action: "File a police report and preserve the report number for the regulator and insurer.", legal_basis: "Insurance condition · GDPR Art.33(5) documentation", rationale: "Cyber-insurance and most DPAs expect a police-report reference for stolen-device cases." },
        { action: "Inventory exactly what data and which accounts were resident on the device (MDM extract, last-sync logs).", legal_basis: "GDPR Art.30 records · Art.33(3)(a)", rationale: "Art.33(3)(a) requires you to describe categories and approximate numbers of data subjects affected — MDM records are the fastest source." },
      ];
    case "other":
    case "":
    default:
      return [
        { action: "Classify the incident type as quickly as possible — the playbook below changes materially per type.", legal_basis: "GDPR Art.33(1) · ISO/IEC 27035-1 §5", rationale: "The 72h Art.33 clock runs from awareness, not from classification — delay in classifying does not pause the clock." },
        { action: "Apply the GENERAL audit-readiness measures (left column) without waiting for classification.", legal_basis: "GDPR Art.5(2) accountability", rationale: "Evidence preservation and DPO notification are the same regardless of incident type." },
      ];
  }
}


// ---------- Prioritized action plan ----------
// Combines deadlines, recommended technical actions, security playbook items
// and notification drafts into a single audit-ready list, ordered by urgency
// (computed from time-to-deadline + statutory severity + priority hints).

export type PriorityLevel = "P0" | "P1" | "P2" | "P3";

export interface PrioritizedAction {
  key: string;                 // stable identifier used for completion tracking
  priority: PriorityLevel;     // P0 critical → P3 informational
  urgencyHours: number | null; // hours until deadline (null if no clock)
  title: string;
  detail: string;              // one-line context / rationale
  legalBasis: string;          // statutory anchor for audit
  source: "deadline" | "notification" | "tech-action" | "security" | "decision";
  framework?: string;
}

const PRIORITY_FROM_HOURS = (h: number | null): PriorityLevel => {
  if (h === null) return "P2";
  if (h < 0) return "P0";
  if (h < 4) return "P0";
  if (h < 24) return "P1";
  if (h < 72) return "P2";
  return "P3";
};

const PRIORITY_FROM_TAG = (tag?: string): PriorityLevel => {
  if (!tag) return "P2";
  const t = tag.toUpperCase();
  if (t.includes("P0") || t.includes("CRITICAL")) return "P0";
  if (t.includes("P1") || t.includes("HIGH")) return "P1";
  if (t.includes("P3") || t.includes("LOW")) return "P3";
  return "P2";
};

const PRIORITY_RANK: Record<PriorityLevel, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function buildPrioritizedPlan(
  s: FormState,
  ai: AIAssessment | null,
  discoveredMs: number,
  notificationStatuses: { framework: string; status: string }[] = [],
): PrioritizedAction[] {
  const out: PrioritizedAction[] = [];
  const now = Date.now();

  // 1. Statutory deadlines — always P0/P1 if active and not satisfied
  for (const d of getDeadlines(s).filter(x => x.applies)) {
    const deadlineMs = discoveredMs + d.hours * 3_600_000;
    const remainingH = (deadlineMs - now) / 3_600_000;
    const sentMatch = notificationStatuses.some(n =>
      n.status === "sent" && d.framework.toLowerCase().includes(n.framework.split("-")[0])
    );
    if (sentMatch) continue;
    out.push({
      key: `deadline:${d.framework}:${d.label}`,
      priority: PRIORITY_FROM_HOURS(remainingH),
      urgencyHours: remainingH,
      title: `${d.framework} — ${d.label}`,
      detail: remainingH < 0
        ? `OVERDUE by ${Math.abs(Math.round(remainingH))}h. Notify immediately and document delay reasoning under Art.33(1).`
        : `${Math.max(0, Math.round(remainingH))}h remaining from discovery. Notification window is statutory.`,
      legalBasis: d.framework,
      source: "deadline",
      framework: d.framework,
    });
  }

  // 2. Pending notification drafts
  for (const n of notificationStatuses) {
    if (n.status === "sent") continue;
    out.push({
      key: `notification:${n.framework}`,
      priority: "P1",
      urgencyHours: null,
      title: `Send ${n.framework} notification draft`,
      detail: "Draft is pre-populated in the Notifications panel. Review, finalise recipient and mark as sent — sending is recorded in the audit trail.",
      legalBasis: n.framework.toUpperCase().includes("GDPR") ? "GDPR Art.33" : n.framework.toUpperCase(),
      source: "notification",
      framework: n.framework,
    });
  }

  // 3. AI security playbook (priority pre-tagged P0/P1/P2 by the model)
  for (const [i, m] of (ai?.security_playbook ?? []).entries()) {
    out.push({
      key: `security:${i}`,
      priority: PRIORITY_FROM_TAG(m.priority),
      urgencyHours: null,
      title: m.measure,
      detail: m.rationale,
      legalBasis: m.legal_basis,
      source: "security",
    });
  }

  // 4. AI recommended technical actions
  for (const [i, raw] of (ai?.recommended_actions ?? []).entries()) {
    const a = normalizeAction(raw);
    out.push({
      key: `tech:${i}`,
      priority: "P2",
      urgencyHours: null,
      title: a.action,
      detail: a.rationale,
      legalBasis: a.legal_basis,
      source: "tech-action",
    });
  }

  // 5. Lawyer-packet decisions
  for (const [i, d] of (ai?.lawyer_packet?.decisions_needed ?? []).entries()) {
    out.push({
      key: `decision:${i}`,
      priority: "P2",
      urgencyHours: null,
      title: d,
      detail: "Decision required from counsel before proceeding. Capture rationale in the audit log.",
      legalBasis: "GDPR Art.33(5) — duty to document",
      source: "decision",
    });
  }

  // Sort: priority asc, then urgency asc (overdue first)
  out.sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    const ah = a.urgencyHours ?? Number.POSITIVE_INFINITY;
    const bh = b.urgencyHours ?? Number.POSITIVE_INFINITY;
    return ah - bh;
  });

  return out;
}

// ---------- Outstanding actions calculation ----------

export interface OutstandingAction {
  kind: "deadline" | "notification" | "decision";
  framework?: string;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
}

export function computeOutstanding(
  s: FormState,
  discoveredMs: number,
  notificationStatuses: { framework: string; status: string }[],
  decisionsNeeded: string[],
): OutstandingAction[] {
  const out: OutstandingAction[] = [];
  const now = Date.now();

  // Deadlines that have not been satisfied by a sent notification
  for (const d of getDeadlines(s).filter(x => x.applies)) {
    const deadlineMs = discoveredMs + d.hours * 3_600_000;
    const remainingH = (deadlineMs - now) / 3_600_000;
    // Map deadline framework to a notification framework (rough match)
    const sentMatching = notificationStatuses.some(n =>
      n.status === "sent" && d.framework.toLowerCase().includes(n.framework.split("-")[0])
    );
    if (sentMatching) continue;
    const severity: OutstandingAction["severity"] =
      remainingH < 0 ? "critical" : remainingH < 4 ? "critical" : remainingH < 24 ? "high" : "medium";
    out.push({
      kind: "deadline",
      framework: d.framework,
      label: `${d.label}${remainingH < 0 ? " — OVERDUE" : ""}`,
      severity,
    });
  }
  // Pending notification drafts
  for (const n of notificationStatuses) {
    if (n.status !== "sent") {
      out.push({
        kind: "notification",
        framework: n.framework,
        label: `${n.framework} draft awaiting send`,
        severity: "medium",
      });
    }
  }
  // Open decisions surfaced by AI
  for (const d of decisionsNeeded) {
    out.push({ kind: "decision", label: d, severity: "low" });
  }
  return out;
}
