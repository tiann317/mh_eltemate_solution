/**
 * Sample / demo FormState — used by the dev "Fill sample data" button so the
 * intake can be skipped to Review or Result without manual typing. Realistic
 * enough to trigger NIS2 + cross-border + Art.34 alerts during assessment.
 */
import type { FormState } from "./aegis";

export const sampleFormState: FormState = {
  // Screen 1 — Discovery
  discoveryTime: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
    .toISOString()
    .slice(0, 16),
  incidentType: "ransomware",
  systemsAffected:
    "Primary customer CRM (EU-West cluster), order-management DB replica, and 3 file servers in Frankfurt DC. Lateral movement detected from compromised contractor VPN account.",
  ongoingStatus: "partially",
  backupsAvailable: "yes",
  deviceEncrypted: "",
  exfiltrationConfirmed: "yes",
  // Screen 2 — Data & people
  dataCategories: ["basic-contact", "financial", "credentials", "health"],
  numAffected: "5k-50k",
  harmTypes: ["financial-harm", "identity", "reputational"],
  childrenAgeBand: "",
  // Screen 3 — Organisation
  sector: "telecom",
  jurisdiction: "DE",
  thirdParty: "processor",
  hlClient: true,
  // Screen 3.5 — Legal context
  controllerName: "Acme Telecom GmbH",
  dpoContact: "dpo@acme-telecom.example.eu",
  processorName: "CloudOps Managed Services Ltd (Ireland)",
  dpaClauseStatus: "in-place",
  crossBorder: "yes",
  affectedMemberStates: "DE, FR, NL, IE, ES",
  csirtContact: "BSI CERT-Bund — incident@cert-bund.de",
  ictThirdParty: "",
  cerOperator: false,
  legalPrivilege: "engaged",
  outsideCounsel: "Hogan Lovells International LLP — Frankfurt office",
  retentionBasis: "GDPR Art.6(1)(c) legal obligation + Art.6(1)(f) legitimate interest in defence of legal claims; 7-year retention aligned with German commercial law.",
};
