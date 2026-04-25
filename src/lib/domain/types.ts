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

export type NumAffected = "" | "u50" | "50-500" | "500-5k" | "5k-50k" | "o50k" | "unknown";

export type HarmType =
  | "financial-harm" | "identity" | "physical" | "reputational"
  | "discrimination" | "loss-access" | "none";

export type Sector =
  | "" | "automotive" | "energy" | "lifesciences" | "financial"
  | "consumer" | "telecom" | "transport" | "digital" | "other";

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
  discoveryTime: string;
  incidentType: IncidentType;
  systemsAffected: string;
  ongoingStatus: OngoingStatus;
  dataCategories: DataCategory[];
  numAffected: NumAffected;
  harmTypes: HarmType[];
  sector: Sector;
  jurisdiction: Jurisdiction;
  thirdParty: ThirdParty;
  hlClient: boolean;
  controllerName: string;
  dpoContact: string;
  processorName: string;
  dpaClauseStatus: DpaStatus;
  crossBorder: CrossBorder;
  affectedMemberStates: string;
  csirtContact: string;
  ictThirdParty: string;
  cerOperator: boolean;
  legalPrivilege: LegalPrivilege;
  outsideCounsel: string;
  retentionBasis: string;
  backupsAvailable: "" | "yes" | "no" | "unknown";
  deviceEncrypted: "" | "yes" | "no" | "unknown";
  exfiltrationConfirmed: "" | "yes" | "no" | "unknown";
  childrenAgeBand: string;
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
