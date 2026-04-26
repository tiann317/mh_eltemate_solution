import { FormState } from "@/lib/aegis";

/**
 * Dev-only helper bar: autofill the current form with realistic fake data,
 * or skip directly to assessment generation. Visible on PreIntake and Intake.
 */

export interface PreIntakeFakeData {
  reporter_name: string;
  reporter_title: string;
  reporter_department: string;
  reporter_role: string;
  contact_email: string;
  contact_phone: string;
  self_check_1: string;
  self_check_2: string;
  self_check_3: string;
  severity_classification: "suspected" | "definite";
  responsible_staff_id: string;
}

export const fakePreIntake: PreIntakeFakeData = {
  reporter_name: "Alex Müller",
  reporter_title: "Head of Information Security",
  reporter_department: "Security",
  reporter_role: "Leading the response — first responder on call",
  contact_email: "alex.muller@example.com",
  contact_phone: "+49 30 1234 5678",
  self_check_1: "yes",
  self_check_2: "yes",
  self_check_3: "yes",
  severity_classification: "definite",
  responsible_staff_id: "",
};

export const fakeIntake: FormState = {
  discoveryTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16),
  incidentType: "ransomware",
  systemsAffected:
    "Finance file server (FIN-FS-01) and 12 endpoints in the Berlin office. Backups on a separate NAS appear unaffected.",
  ongoingStatus: "yes",
  dataCategories: ["basic-contact", "financial", "credentials"],
  numAffected: "5k-50k",
  harmTypes: ["financial-harm", "identity", "loss-access"],
  sector: "financial",
  jurisdiction: "DE",
  thirdParty: "processor",
  hlClient: true,
  controllerName: "Acme Finance GmbH",
  dpoContact: "dpo@acme-finance.example.com",
  processorName: "CloudOps Services Ltd",
  dpaClauseStatus: "in-place",
  crossBorder: "yes",
  affectedMemberStates: "DE, FR, NL",
  csirtContact: "",
  ictThirdParty: "CloudOps Services Ltd (IaaS provider)",
  cerOperator: false,
  legalPrivilege: "engaged",
  outsideCounsel: "Hogan Lovells International LLP",
  retentionBasis: "GDPR Art.30 record-keeping; NIS2 incident logs.",
  backupsAvailable: "yes",
  deviceEncrypted: "",
  exfiltrationConfirmed: "unknown",
  childrenAgeBand: "",
};

interface Props {
  onAutofill: () => void;
  /** Optional — when provided, shows a "Skip to assessment" button. */
  onSkipToAssessment?: () => void;
  label?: string;
}

export const DevJumpBar = ({ onAutofill, onSkipToAssessment, label = "Dev tools" }: Props) => {
  return (
    <div
      role="region"
      aria-label="Developer tools"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "#fef3c7",
        borderBottom: "1px solid #f59e0b",
        fontSize: 12,
        color: "#78350f",
      }}
    >
      <strong style={{ marginRight: 8 }}>{label}:</strong>
      <button
        type="button"
        onClick={onAutofill}
        style={{
          background: "#1a56db",
          color: "#fff",
          border: "none",
          padding: "4px 10px",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Autofill with fake data
      </button>
      {onSkipToAssessment && (
        <button
          type="button"
          onClick={onSkipToAssessment}
          style={{
            background: "#b45309",
            color: "#fff",
            border: "none",
            padding: "4px 10px",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Skip to assessment →
        </button>
      )}
      <span style={{ marginLeft: "auto", opacity: 0.7 }}>Dev only</span>
    </div>
  );
};

export default DevJumpBar;
