import { Alert } from "./Alert";
import { ValidationBanner } from "./ValidationBanner";
import { FieldExplainer } from "./FieldExplainer";
import { ReasoningBadge } from "./ReasoningBadge";
import type { StepErrors } from "@/lib/validation";
import { FormState, INCIDENT_TYPE_LABELS, ONGOING_LABELS, IncidentType, OngoingStatus } from "@/lib/aegis";

interface Props {
  state: FormState;
  setState: (s: FormState) => void;
  errors?: StepErrors;
  onNext: () => void;
}

export const Screen1 = ({ state, setState, errors, onNext }: Props) => {
  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState({ ...state, [k]: v });

  return (
    <div className="mx-auto" style={{ maxWidth: 760, padding: 32 }}>
      <ValidationBanner errors={errors} />
      <div className="aegis-section-label mb-2">Step 1 of 5</div>
      <h2 className="aegis-title mb-3">Discovery & Incident Basics</h2>
      <p className="aegis-helper mb-8">
        Completed by: IT / InfoSec first responder. Fill in immediately on discovery.
      </p>

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="discoveryTime">
          Date and time of discovery <span style={{ color: "#ff6b6b" }}>*</span>
        </label>
        <input
          id="discoveryTime"
          type="datetime-local"
          className="aegis-input"
          value={state.discoveryTime}
          onChange={(e) => update("discoveryTime", e.target.value)}
          required
        />
        <div className="aegis-field-helper">
          This starts all regulatory clocks. Record to the minute. Source: SOC alert, incident ticket, or the person who found it.
        </div>
        <FieldExplainer
          term="discovery"
          plain="Under EU breach law, &lsquo;discovery&rsquo; is the moment your organisation becomes reasonably certain that a breach has occurred — not when investigation completes. The 72-hour clock starts here."
          examples="A SOC analyst confirms ransom note; a sysadmin sees encrypted files; a customer reports their data appearing online."
          cite="GDPR Art.33(1); EDPB Guidelines WP250"
        />
      </div>

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="incidentType">
          Type of incident <span style={{ color: "#ff6b6b" }}>*</span>
        </label>
        <select
          id="incidentType"
          className="aegis-select"
          value={state.incidentType}
          onChange={(e) => update("incidentType", e.target.value as IncidentType)}
          required
        >
          <option value="">(select...)</option>
          {(Object.keys(INCIDENT_TYPE_LABELS) as Array<keyof typeof INCIDENT_TYPE_LABELS>).map((k) => (
            <option key={k} value={k}>{INCIDENT_TYPE_LABELS[k]}</option>
          ))}
        </select>
        <FieldExplainer
          term="personal data breach"
          plain="A breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data. Loss of availability counts — encryption by ransomware is a breach even without exfiltration."
          cite="GDPR Art.4(12)"
        />

        {state.incidentType === "ransomware" && (
          <Alert
            variant="warning"
            title="Availability breach confirmed"
            body="Ransomware that encrypts personal data constitutes a personal data breach under GDPR even without confirmed exfiltration. Loss of availability alone meets the breach definition. Your 72-hour notification clock starts now."
            cite="— GDPR Art.4(12)"
          />
        )}
        {state.incidentType === "ot-ics" && (
          <Alert
            variant="warning"
            title="NIS2 and CER may apply independently of GDPR"
            body="An OT/ICS incident may trigger a 24-hour early warning to your national competent authority even where no personal data breach is confirmed. Do not wait for data confirmation before assessing your NIS2 obligations."
            cite="— NIS2 Art.23(1)"
          />
        )}
      </div>

      {/* Ransomware follow-up — backups */}
      {state.incidentType === "ransomware" && (
        <div className="aegis-card mb-6">
          <ReasoningBadge
            reason="Backup posture is decisive for the Art.34 individual-notification analysis: if data can be restored without paying, the &lsquo;high risk&rsquo; threshold may not be met."
            trigger="Incident type = Ransomware"
          />
          <label className="aegis-label" htmlFor="backups">
            Are clean, recent backups available? <span style={{ color: "#ff6b6b" }}>*</span>
          </label>
          <select
            id="backups"
            className="aegis-select"
            value={state.backupsAvailable}
            onChange={e => update("backupsAvailable", e.target.value as FormState["backupsAvailable"])}
          >
            <option value="">(select...)</option>
            <option value="yes">Yes — restore in progress / possible without paying ransom</option>
            <option value="no">No — backups also encrypted or unavailable</option>
            <option value="unknown">Unknown — under assessment</option>
          </select>
          {state.backupsAvailable === "no" && (
            <Alert
              variant="danger"
              title="Loss of availability is highly likely to be material"
              body="With no clean backup path, the breach may produce prolonged loss of access to data — strong indicator of high risk to data subjects under Art.34."
              cite="— GDPR Art.34(1); EDPB Guidelines WP250"
            />
          )}
        </div>
      )}

      {/* Lost device follow-up — encryption */}
      {state.incidentType === "lost-device" && (
        <div className="aegis-card mb-6">
          <ReasoningBadge
            reason="Effective encryption can exempt you from notifying individuals under Art.34(3)(a) — but only if the key was not also compromised."
            trigger="Incident type = Lost / stolen device"
          />
          <label className="aegis-label" htmlFor="encrypted">
            Was the device encrypted with strong, current keys? <span style={{ color: "#ff6b6b" }}>*</span>
          </label>
          <select
            id="encrypted"
            className="aegis-select"
            value={state.deviceEncrypted}
            onChange={e => update("deviceEncrypted", e.target.value as FormState["deviceEncrypted"])}
          >
            <option value="">(select...)</option>
            <option value="yes">Yes — full-disk encryption, keys not compromised</option>
            <option value="no">No — unencrypted or weak encryption</option>
            <option value="unknown">Unknown</option>
          </select>
          {state.deviceEncrypted === "yes" && (
            <Alert
              variant="info"
              title="Possible Art.34(3)(a) exemption from individual notification"
              body="If the personal data was rendered unintelligible to any unauthorised person — typically through state-of-the-art encryption — Art.34 individual notification may not be required. Document the encryption standard and key custody."
              cite="— GDPR Art.34(3)(a)"
            />
          )}
          {state.deviceEncrypted === "no" && (
            <Alert
              variant="warning"
              title="No encryption defence — Art.34 likely engaged"
              body="Without encryption you cannot rely on the Art.34(3)(a) exemption. Plan for individual notification if the data engages high risk."
              cite="— GDPR Art.34(1)"
            />
          )}
        </div>
      )}

      {/* Unauthorised access follow-up — exfiltration */}
      {state.incidentType === "unauthorised-access" && (
        <div className="aegis-card mb-6">
          <ReasoningBadge
            reason="Confirmed exfiltration changes the breach from a confidentiality risk to a confirmed disclosure — driving Art.34 and harm analysis."
            trigger="Incident type = Unauthorised access"
          />
          <label className="aegis-label" htmlFor="exfil">
            Is data exfiltration confirmed? <span style={{ color: "#ff6b6b" }}>*</span>
          </label>
          <select
            id="exfil"
            className="aegis-select"
            value={state.exfiltrationConfirmed}
            onChange={e => update("exfiltrationConfirmed", e.target.value as FormState["exfiltrationConfirmed"])}
          >
            <option value="">(select...)</option>
            <option value="yes">Yes — exfiltration evidenced (egress logs / extortion sample / leak)</option>
            <option value="no">No — access only, no evidence of copy-out</option>
            <option value="unknown">Unknown — investigation ongoing</option>
          </select>
        </div>
      )}

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="systems">Systems or assets affected</label>
        <input
          id="systems"
          type="text"
          className="aegis-input"
          placeholder="e.g. CRM database, HR system, vehicle telematics platform"
          value={state.systemsAffected}
          onChange={(e) => update("systemsAffected", e.target.value)}
        />
        <div className="aegis-field-helper">
          Be specific. System name helps identify the data owner and what data may be held. Source: IT asset register, CMDB, or system owner.
        </div>
      </div>

      <div className="aegis-card mb-8">
        <label className="aegis-label" htmlFor="ongoing">Incident status</label>
        <select
          id="ongoing"
          className="aegis-select"
          value={state.ongoingStatus}
          onChange={(e) => update("ongoingStatus", e.target.value as OngoingStatus)}
        >
          <option value="">(select...)</option>
          {(Object.keys(ONGOING_LABELS) as Array<keyof typeof ONGOING_LABELS>).map((k) => (
            <option key={k} value={k}>{ONGOING_LABELS[k]}</option>
          ))}
        </select>
        <FieldExplainer
          term="containment"
          plain="Containment means the attacker no longer has the access they used to cause the breach, and no further damage is being done. It is not the same as full remediation."
        />

        {state.ongoingStatus === "yes" && (
          <Alert
            variant="danger"
            title="Ongoing incident — interim notification may be required"
            body="Some supervisory authorities expect early contact before the formal 72-hour notification where an incident is live and evolving. Document every containment step taken with timestamps."
            cite="— GDPR Art.33(1); EDPB Guidelines WP250"
          />
        )}
      </div>

      <button
        className="aegis-btn-primary"
        onClick={onNext}
        disabled={!state.discoveryTime || !state.incidentType}
      >
        Next: data &amp; people →
      </button>
    </div>
  );
};
