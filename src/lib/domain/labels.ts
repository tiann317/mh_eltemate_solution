import type {
  DataCategory, HarmType, IncidentType, Jurisdiction, NumAffected,
  OngoingStatus, Sector, ThirdParty,
} from "./types";

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

// Source: ENISA CSIRTs Network registry. Used for NIS2 Art.23 notifications.
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
