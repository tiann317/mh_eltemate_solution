import { useRef } from "react";
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
  onNext: (draft?: FormState) => void;
}

export const Screen1 = ({ state, setState, errors, onNext }: Props) => {
  const discoveryInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState({ ...state, [k]: v });

  const handleNext = () => {
    const latestDiscoveryTime = discoveryInputRef.current?.value ?? state.discoveryTime;
    const draft = latestDiscoveryTime !== state.discoveryTime
      ? { ...state, discoveryTime: latestDiscoveryTime }
      : state;

    if (draft !== state) setState(draft);
    onNext(draft);
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 760, padding: 32 }}>
      <ValidationBanner errors={errors} />
      <div className="aegis-section-label mb-2">Step 1 of 5 · What happened</div>
      <h2 className="aegis-title mb-3">Tell us what you've found</h2>
      <p className="aegis-helper mb-8">
        These first questions help us understand the basics. Best filled in by
        the person who first noticed the issue, or by your IT or security team.
        If you don't know an answer, choose "unknown" — that's useful too.
      </p>

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="discoveryTime">
          When did you (or your team) first notice this? <span style={{ color: "#ff6b6b" }}>*</span>
        </label>
        <input
          id="discoveryTime"
          ref={discoveryInputRef}
          type="datetime-local"
          className="aegis-input"
          value={state.discoveryTime}
          onChange={(e) => update("discoveryTime", e.target.value)}
          required
        />
        <div className="aegis-field-helper">
          As exact as you can — the date and time matter. This is when reporting
          deadlines start running. Use the time on the alert, the ticket, or
          when the person who spotted it first realised something was wrong.
        </div>
        <FieldExplainer
          term="What 'noticing' means here"
          plain="In data-protection law, the clock starts when your organisation is reasonably sure something has gone wrong — not when the full investigation is finished. Best to record the earliest credible moment."
          examples="A security analyst confirms a ransom note; an admin sees files are encrypted; a customer tells you their data has appeared online."
          cite="GDPR Art.33(1); EDPB Guidelines WP250"
        />
      </div>

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="incidentType">
          What kind of incident is this? <span style={{ color: "#ff6b6b" }}>*</span>
        </label>
        <select
          id="incidentType"
          className="aegis-select"
          value={state.incidentType}
          onChange={(e) => update("incidentType", e.target.value as IncidentType)}
          required
        >
          <option value="">Choose the closest match…</option>
          {(Object.keys(INCIDENT_TYPE_LABELS) as Array<keyof typeof INCIDENT_TYPE_LABELS>).map((k) => (
            <option key={k} value={k}>{INCIDENT_TYPE_LABELS[k]}</option>
          ))}
        </select>
        <FieldExplainer
          term="What counts as a 'data breach'"
          plain="Anything that means personal information is lost, changed, seen by someone who shouldn't have seen it, or made unavailable — even temporarily. Ransomware that locks files counts, even if no one stole them."
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
            Do you have a recent, working backup you can restore from? <span style={{ color: "#ff6b6b" }}>*</span>
          </label>
          <select
            id="backups"
            className="aegis-select"
            value={state.backupsAvailable}
            onChange={e => update("backupsAvailable", e.target.value as FormState["backupsAvailable"])}
          >
            <option value="">Choose one…</option>
            <option value="yes">Yes — we can restore without paying the ransom</option>
            <option value="no">No — backups are also affected or missing</option>
            <option value="unknown">Not sure yet — still checking</option>
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
            Was the device protected with up-to-date encryption? <span style={{ color: "#ff6b6b" }}>*</span>
          </label>
          <select
            id="encrypted"
            className="aegis-select"
            value={state.deviceEncrypted}
            onChange={e => update("deviceEncrypted", e.target.value as FormState["deviceEncrypted"])}
          >
            <option value="">Choose one…</option>
            <option value="yes">Yes — full-disk encryption was on, and the password / key wasn't compromised</option>
            <option value="no">No — it was unencrypted, or the encryption was weak / out of date</option>
            <option value="unknown">Not sure</option>
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
            Do you have evidence that data was actually copied or taken? <span style={{ color: "#ff6b6b" }}>*</span>
          </label>
          <select
            id="exfil"
            className="aegis-select"
            value={state.exfiltrationConfirmed}
            onChange={e => update("exfiltrationConfirmed", e.target.value as FormState["exfiltrationConfirmed"])}
          >
            <option value="">Choose one…</option>
            <option value="yes">Yes — we've seen proof (network logs, a leaked sample, or an extortion message)</option>
            <option value="no">No — someone got in, but we don't have evidence anything was copied out</option>
            <option value="unknown">Not sure yet — still investigating</option>
          </select>
        </div>
      )}

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="systems">Which systems or services are affected?</label>
        <input
          id="systems"
          type="text"
          className="aegis-input"
          placeholder="e.g. our customer database, the HR portal, the connected-vehicle platform"
          value={state.systemsAffected}
          onChange={(e) => update("systemsAffected", e.target.value)}
        />
        <div className="aegis-field-helper">
          The names you'd use internally are fine. This helps us understand
          what kind of information may have been touched and who looks after it.
        </div>
      </div>

      <div className="aegis-card mb-8">
        <label className="aegis-label" htmlFor="ongoing">Is the incident still happening right now?</label>
        <select
          id="ongoing"
          className="aegis-select"
          value={state.ongoingStatus}
          onChange={(e) => update("ongoingStatus", e.target.value as OngoingStatus)}
        >
          <option value="">Choose one…</option>
          {(Object.keys(ONGOING_LABELS) as Array<keyof typeof ONGOING_LABELS>).map((k) => (
            <option key={k} value={k}>{ONGOING_LABELS[k]}</option>
          ))}
        </select>
        <FieldExplainer
          term="What 'contained' means"
          plain="Contained means whoever (or whatever) caused the issue can no longer make it worse — for example, the attacker has been locked out, or the affected device has been disconnected. It doesn't mean everything is fixed."
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
        onClick={handleNext}
      >
        Next: who and what was affected →
      </button>
    </div>
  );
};
