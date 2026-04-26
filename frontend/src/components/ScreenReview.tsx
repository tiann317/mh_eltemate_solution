import { ValidationBanner } from "./ValidationBanner";
import { validateAll } from "@/lib/validation";
import {
  FormState, INCIDENT_TYPE_LABELS, ONGOING_LABELS, DATA_CATEGORY_LABELS,
  NUM_AFFECTED_LABELS, HARM_LABELS, SECTOR_LABELS, DPA_MAP, THIRD_PARTY_LABELS,
} from "@/lib/aegis";

interface Props {
  state: FormState;
  onBack: () => void;
  onEdit: (step: 1 | 2 | 3 | 35) => void;
  onConfirm: () => void;
}

const STEP_LABELS: Record<1 | 2 | 3 | 35, string> = {
  1: "Discovery",
  2: "Data & people",
  3: "Organisation",
  35: "Legal context",
};

export const ScreenReview = ({ state, onBack, onEdit, onConfirm }: Props) => {
  const review = validateAll(state);

  const row = (label: string, value: string) => (
    <div style={{ display: "flex", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12.5 }}>
      <div style={{ width: 220, color: "#a8bbd4" }}>{label}</div>
      <div style={{ flex: 1, color: "#e2e8f0" }}>{value || "—"}</div>
    </div>
  );

  return (
    <div className="mx-auto" style={{ maxWidth: 860, padding: 32 }}>
      <div className="aegis-section-label mb-2">Step 5 of 5</div>
      <h2 className="aegis-title mb-3">Review &amp; confirm</h2>
      <p className="aegis-helper mb-6">
        Final check before generating the regulatory assessment. Validation has been re-run across every step. Fix any issues
        below — once generated, this snapshot is persisted to your incident dashboard.
      </p>

      {!review.ok && (
        <div
          role="alert"
          style={{
            marginBottom: 20, padding: "14px 16px",
            border: "1px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.08)",
            color: "#fecaca",
          }}
        >
          <div style={{ color: "#ef4444", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            ⚠ {review.totalErrors} item{review.totalErrors === 1 ? "" : "s"} need attention before generation
          </div>
          {review.perStep.filter(p => !p.ok).map(p => (
            <div key={p.step} style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <strong style={{ fontSize: 12.5, color: "#fff" }}>{STEP_LABELS[p.step]}</strong>
                <button
                  type="button"
                  onClick={() => onEdit(p.step)}
                  style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.2)",
                    color: "#63AFF0", fontSize: 11, padding: "2px 10px", cursor: "pointer",
                  }}
                >
                  Edit →
                </button>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
                {Object.entries(p.errors).map(([k, m]) => <li key={k}>{m}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {review.ok && (
        <div
          style={{
            marginBottom: 20, padding: "12px 14px",
            border: "1px solid rgba(82,214,138,0.4)", background: "rgba(82,214,138,0.08)",
            color: "#52D68A", fontSize: 12.5,
          }}
        >
          ✓ All required fields validated across every step. Ready to generate the assessment.
        </div>
      )}

      <ValidationBanner errors={undefined} />

      {/* Snapshot panels */}
      {([
        {
          step: 1 as const, title: STEP_LABELS[1],
          rows: [
            ["Discovery time", state.discoveryTime],
            ["Incident type", state.incidentType ? INCIDENT_TYPE_LABELS[state.incidentType] : ""],
            ["Systems affected", state.systemsAffected],
            ["Containment", state.ongoingStatus ? ONGOING_LABELS[state.ongoingStatus] : ""],
            ...(state.incidentType === "ransomware" ? [["Backups available", state.backupsAvailable]] : []),
            ...(state.incidentType === "lost-device" ? [["Device encrypted", state.deviceEncrypted]] : []),
            ...(state.incidentType === "unauthorised-access" ? [["Exfiltration confirmed", state.exfiltrationConfirmed]] : []),
          ] as [string, string][],
        },
        {
          step: 2 as const, title: STEP_LABELS[2],
          rows: [
            ["Data categories", state.dataCategories.map(c => DATA_CATEGORY_LABELS[c]).join(", ")],
            ["Number affected", state.numAffected ? NUM_AFFECTED_LABELS[state.numAffected] : ""],
            ["Foreseeable harm", state.harmTypes.map(h => HARM_LABELS[h]).join(", ")],
            ...(state.dataCategories.includes("children") ? [["Children age band", state.childrenAgeBand]] : []),
          ] as [string, string][],
        },
        {
          step: 3 as const, title: STEP_LABELS[3],
          rows: [
            ["Sector", state.sector ? SECTOR_LABELS[state.sector] : ""],
            ["Lead DPA", state.jurisdiction ? DPA_MAP[state.jurisdiction] : ""],
            ["Third-party involvement", state.thirdParty ? THIRD_PARTY_LABELS[state.thirdParty] : ""],
            ["Hogan Lovells / ELTEMATE client", state.hlClient ? "Yes" : "No"],
          ] as [string, string][],
        },
        {
          step: 35 as const, title: STEP_LABELS[35],
          rows: [
            ["Controller", state.controllerName],
            ["DPO contact", state.dpoContact],
            ["Processor", state.processorName],
            ["Cross-border", state.crossBorder],
            ["Affected member states", state.affectedMemberStates],
            ["CSIRT contact", state.csirtContact],
            ["ICT third party (DORA)", state.ictThirdParty],
            ["Legal privilege", state.legalPrivilege],
            ["Outside counsel", state.outsideCounsel],
            ["Retention basis", state.retentionBasis],
          ] as [string, string][],
        },
      ]).map(panel => (
        <div key={panel.step} className="aegis-card mb-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div className="aegis-section-label" style={{ margin: 0 }}>{panel.title}</div>
            <button
              type="button"
              onClick={() => onEdit(panel.step)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.18)",
                color: "#63AFF0", fontSize: 11, padding: "3px 12px", cursor: "pointer",
              }}
            >
              Edit
            </button>
          </div>
          <div>{panel.rows.map(([k, v]) => row(k, v))}</div>
        </div>
      ))}

      <div className="flex gap-3 flex-col sm:flex-row mt-6">
        <button className="aegis-btn-secondary" onClick={onBack} style={{ flex: "0 0 auto" }}>← Back</button>
        <button className="aegis-btn-primary" onClick={onConfirm} disabled={!review.ok}>
          {review.ok ? "Confirm & generate assessment →" : `Fix ${review.totalErrors} item${review.totalErrors === 1 ? "" : "s"} to continue`}
        </button>
      </div>
    </div>
  );
};
