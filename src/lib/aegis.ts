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

// ---------- LDA API (proxied through edge function) ----------

import { supabase } from "@/integrations/supabase/client";

// Kept for backwards compatibility — token is now handled server-side.
// Probe the edge function with a minimal request — if creds aren't configured
// the function returns { skipped: "..." } and we treat LDA as unavailable.
export const getLDAToken = async (): Promise<string | null> => {
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

export const callOpenAI = async (userMessage: string): Promise<AIAssessment | null> => {
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

export function buildNotificationDrafts(s: FormState, ai: AIAssessment | null): NotificationDraft[] {
  const drafts: NotificationDraft[] = [];
  const personal = hasAnyPersonalData(s.dataCategories);
  const dpa = s.jurisdiction ? DPA_MAP[s.jurisdiction] : "Lead supervisory authority";
  const nca = s.jurisdiction ? (NCA_MAP[s.jurisdiction] || "National competent authority") : "National competent authority";

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
  "internal-escalation": "Internal",
};

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
