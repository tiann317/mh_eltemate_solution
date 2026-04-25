import { Alert } from "./Alert";
import { ValidationBanner } from "./ValidationBanner";
import { FieldExplainer } from "./FieldExplainer";
import { ReasoningBadge } from "./ReasoningBadge";
import type { StepErrors } from "@/lib/validation";
import {
  FormState, DATA_CATEGORY_LABELS, DANGER_CATEGORIES, NUM_AFFECTED_LABELS, HARM_LABELS,
  DataCategory, NumAffected, HarmType, hasAnyDanger,
} from "@/lib/aegis";

interface Props {
  state: FormState;
  setState: (s: FormState) => void;
  errors?: StepErrors;
  onBack: () => void;
  onNext: () => void;
}

const ORDER: DataCategory[] = [
  "basic-contact", "financial", "credentials",
  "location", "health", "biometric", "children", "criminal", "special-other",
  "unknown",
];

const HARM_ORDER: HarmType[] = [
  "financial-harm", "identity", "physical", "reputational", "discrimination", "loss-access", "none",
];

export const Screen2 = ({ state, setState, errors, onBack, onNext }: Props) => {
  const toggleData = (c: DataCategory) => {
    const has = state.dataCategories.includes(c);
    setState({
      ...state,
      dataCategories: has
        ? state.dataCategories.filter(x => x !== c)
        : [...state.dataCategories, c],
    });
  };
  const toggleHarm = (h: HarmType) => {
    const has = state.harmTypes.includes(h);
    setState({
      ...state,
      harmTypes: has ? state.harmTypes.filter(x => x !== h) : [...state.harmTypes, h],
    });
  };

  const dangerSelected = hasAnyDanger(state.dataCategories);
  const locationSelected = state.dataCategories.includes("location");
  const unknownSelected = state.dataCategories.includes("unknown");
  const highVolume = state.numAffected === "5k-50k" || state.numAffected === "o50k";
  const physical = state.harmTypes.includes("physical");

  const childrenSelected = state.dataCategories.includes("children");

  return (
    <div className="mx-auto" style={{ maxWidth: 760, padding: 32 }}>
      <ValidationBanner errors={errors} />
      <div className="aegis-section-label mb-2">Step 2 of 5</div>
      <h2 className="aegis-title mb-3">Data Categories &amp; People Affected</h2>
      <p className="aegis-helper mb-8">
        Completed by: Data Protection Officer and system / data owner. This determines notifiability under GDPR Art.33.
      </p>

      <div className="aegis-card mb-6">
        <div className="aegis-label">
          Categories of personal data involved <span style={{ color: "#ff6b6b" }}>*</span>
        </div>
        <div className="aegis-field-helper" style={{ marginTop: 0, marginBottom: 12 }}>
          Select all that apply. Source: data inventory, ROPA, system owner, or DPO. If unknown, select the last option.
        </div>
        <FieldExplainer
          term="personal data"
          plain="Any information relating to an identified or identifiable natural person — directly (name, ID number) or indirectly (IP address, device ID, location, an online identifier)."
          examples="Email address, employee number, photo, GPS trace, customer ID, vehicle VIN linked to an owner."
          cite="GDPR Art.4(1)"
        />
        <FieldExplainer
          term="special category data"
          plain="A protected sub-set of personal data: racial/ethnic origin, political opinions, religious beliefs, trade-union membership, genetic, biometric, health, sex-life or sexual-orientation data. Breaches involving these almost always require both DPA and individual notification."
          cite="GDPR Art.9(1)"
        />
        <FieldExplainer
          term="children's data"
          plain="Personal data relating to children. EU law treats children as warranting specific protection because they are less aware of risks. Breaches involving children's data almost always meet the &lsquo;high risk&rsquo; threshold."
          cite="GDPR Recital 38; Art.8"
        />
        <div className="flex flex-wrap gap-2">
          {ORDER.map(c => {
            const selected = state.dataCategories.includes(c);
            const danger = DANGER_CATEGORIES.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleData(c)}
                className={`aegis-pill ${danger ? "danger" : ""} ${selected ? "selected" : ""}`}
                aria-pressed={selected}
              >
                {DATA_CATEGORY_LABELS[c]}
              </button>
            );
          })}
        </div>

        {dangerSelected && (
          <Alert
            variant="danger"
            title="GDPR Art.9 — special category data detected"
            body="One or more selected data types are special category data under GDPR Art.9(1). This breach very likely meets the Art.33 supervisory authority notification threshold. Individual notification to affected data subjects under Art.34 is also likely required unless the data was effectively encrypted and the key uncompromised."
            cite="— GDPR Art.9(1), Art.33(1), Art.34(1)"
          />
        )}
        {locationSelected && (
          <Alert
            variant="warning"
            title="Automotive / mobility sector flag — telematics data"
            body="Location and telematics data can reveal sensitive patterns including home address, daily routine, and health inferences from driving behaviour. Treat as high-risk regardless of Art.9 classification. EDPB guidelines on connected vehicles apply."
            cite="— EDPB Guidelines on connected vehicles and road transport"
          />
        )}
        {unknownSelected && (
          <Alert
            variant="info"
            title="Document your investigation steps now"
            body="The 72-hour clock runs from when you became aware of the breach — not when you confirmed all data details. Record every investigative step you take with timestamps. Uncertainty does not pause the clock."
            cite="— GDPR Art.33(1); EDPB Guidelines WP250"
          />
        )}
      </div>

      {childrenSelected && (
        <div className="aegis-card mb-6">
          <ReasoningBadge
            reason="Children's data triggers heightened protection — the age band shapes whether parental notification or child-friendly language is required."
            trigger="Data category = Children's data"
          />
          <label className="aegis-label" htmlFor="ageBand">Age band of affected children</label>
          <select
            id="ageBand"
            className="aegis-select"
            value={state.childrenAgeBand}
            onChange={e => setState({ ...state, childrenAgeBand: e.target.value })}
          >
            <option value="">(select...)</option>
            <option value="under-13">Under 13</option>
            <option value="13-16">13 – 16</option>
            <option value="16-18">16 – 18</option>
            <option value="mixed">Mixed / unknown</option>
          </select>
        </div>
      )}

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="numAffected">
          Approximate number of individuals affected <span style={{ color: "#ff6b6b" }}>*</span>
        </label>
        <select
          id="numAffected"
          className="aegis-select"
          value={state.numAffected}
          onChange={e => setState({ ...state, numAffected: e.target.value as NumAffected })}
          required
        >
          <option value="">(select...)</option>
          {(Object.keys(NUM_AFFECTED_LABELS) as Array<keyof typeof NUM_AFFECTED_LABELS>).map(k => (
            <option key={k} value={k}>{NUM_AFFECTED_LABELS[k]}</option>
          ))}
        </select>
        <div className="aegis-field-helper">
          Source: database admin, system owner, or data inventory. Estimate now — refine later. The clock does not wait for exact figures.
        </div>
        {highVolume && (
          <Alert
            variant="warning"
            title="Scale threshold — Art.34 individual notification likely required"
            body="At this volume, direct notification to affected individuals is likely required where the breach poses high risk to their rights and freedoms. Begin preparing consumer-facing communication templates now, in parallel with the DPA notification."
            cite="— GDPR Art.34(1)"
          />
        )}
      </div>

      <div className="aegis-card mb-8">
        <div className="aegis-label">Potential harm to affected individuals</div>
        <div className="aegis-field-helper" style={{ marginTop: 0, marginBottom: 12 }}>
          Source: DPO judgment informed by data type and context. Select all that could plausibly apply.
        </div>
        <div className="flex flex-wrap gap-2">
          {HARM_ORDER.map(h => {
            const selected = state.harmTypes.includes(h);
            return (
              <button
                key={h}
                type="button"
                onClick={() => toggleHarm(h)}
                className={`aegis-pill ${selected ? "selected" : ""}`}
                aria-pressed={selected}
              >
                {HARM_LABELS[h]}
              </button>
            );
          })}
        </div>
        {physical && (
          <Alert
            variant="danger"
            title="Physical harm flagged — escalate immediately"
            body="Where a breach could result in physical harm to individuals — for example location data disclosed to an abuser, or safety-critical system data compromised — notification urgency is at its highest level. Escalate to senior leadership immediately. Consider whether law enforcement notification is required."
            cite="— GDPR Art.34(1); Recital 85"
          />
        )}
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <button className="aegis-btn-secondary" onClick={onBack} style={{ flex: "0 0 auto" }}>
          ← Back
        </button>
        <button
          className="aegis-btn-primary"
          onClick={onNext}
          disabled={state.dataCategories.length === 0 || !state.numAffected}
        >
          Next: organisation →
        </button>
      </div>
    </div>
  );
};
