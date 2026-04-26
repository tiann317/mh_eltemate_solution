import { Alert } from "./Alert";
import { ValidationBanner } from "./ValidationBanner";
import type { StepErrors } from "@/lib/validation";
import {
  FormState, SECTOR_LABELS, DPA_MAP, THIRD_PARTY_LABELS,
  Sector, Jurisdiction, ThirdParty, isNIS2Sector, isFinancial,
} from "@/lib/aegis";

interface Props {
  state: FormState;
  setState: (s: FormState) => void;
  errors?: StepErrors;
  onBack: () => void;
  onNext: () => void;
  loading: boolean;
}

export const Screen3 = ({ state, setState, errors, onBack, onNext, loading }: Props) => {
  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState({ ...state, [k]: v });

  return (
    <div className="mx-auto" style={{ maxWidth: 760, padding: 32 }}>
      <ValidationBanner errors={errors} />
      <div className="aegis-section-label mb-2">Step 3 of 5 · About your organisation</div>
      <h2 className="aegis-title mb-3">A bit about your organisation</h2>
      <p className="aegis-helper mb-8">
        Best filled in by your DPO or someone in Legal. Your answers help us
        work out which rules apply and which authorities — if any — need to be
        told.
      </p>

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="sector">
          What sector does your organisation work in? <span style={{ color: "#ff6b6b" }}>*</span>
        </label>
        <select
          id="sector"
          className="aegis-select"
          value={state.sector}
          onChange={e => update("sector", e.target.value as Sector)}
          required
        >
          <option value="">Choose the closest match…</option>
          {(Object.keys(SECTOR_LABELS) as Array<keyof typeof SECTOR_LABELS>).map(k => (
            <option key={k} value={k}>{SECTOR_LABELS[k]}</option>
          ))}
        </select>

        {isNIS2Sector(state.sector) && (
          <Alert
            variant="warning"
            title="NIS2 Directive — essential or important entity"
            body="Your sector falls within NIS2 scope. If this incident has affected your essential services, a 24-hour early warning to your national competent authority (NCA) is required — separate from and in addition to your GDPR Art.33 DPA notification. These go to two different authorities with two different deadlines."
            cite="— NIS2 Directive 2022/2555, Art.23(1)"
          />
        )}
        {isFinancial(state.sector) && (
          <Alert
            variant="danger"
            title="DORA applies — 4-hour initial report"
            body="Under DORA, if this qualifies as a major ICT-related incident, an initial report to your financial competent authority (FCA / BaFin / ECB / DNB etc.) is required within 4 hours of classification. This is the most urgent deadline in EU breach law. Begin major incident classification immediately in parallel with this intake."
            cite="— DORA Regulation 2022/2554, Art.19(4)(a)"
          />
        )}
      </div>

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="jurisdiction">
          Where is your organisation mainly based in Europe? <span style={{ color: "#ff6b6b" }}>*</span>
        </label>
        <select
          id="jurisdiction"
          className="aegis-select"
          value={state.jurisdiction}
          onChange={e => update("jurisdiction", e.target.value as Jurisdiction)}
          required
        >
          <option value="">Choose a country…</option>
          {(Object.keys(DPA_MAP) as Array<keyof typeof DPA_MAP>).map(k => (
            <option key={k} value={k}>{DPA_MAP[k]}</option>
          ))}
        </select>
        <div className="aegis-field-helper">
          We use this to work out which data-protection authority leads on the case. If you're unsure, pick the country where your headquarters or main EU office is.
        </div>

        {state.jurisdiction === "UK" && (
          <Alert
            variant="info"
            title="UK post-Brexit — separate regime"
            body="UK GDPR and the Data Protection Act 2018 apply. Notify the ICO within 72 hours. If you also have EU establishments, you may have concurrent obligations to both the ICO and a lead EU DPA."
            cite="— UK GDPR Art.33; Data Protection Act 2018"
          />
        )}
        {state.jurisdiction === "DE" && (
          <Alert
            variant="info"
            title="Germany — federal DPA structure"
            body="Germany has a federal DPA (BfDI) and 16 state-level DPAs. For private sector companies, the competent Landesbehörde depends on your establishment location. Seek legal advice on jurisdiction."
            cite="— BDSG; GDPR Art.55"
          />
        )}
        {state.jurisdiction === "IE" && (
          <Alert
            variant="info"
            title="Ireland — lead DPA for many multinationals"
            body="The DPC is the lead supervisory authority for many large multinationals with EU headquarters in Ireland. Other concerned DPAs are notified by the DPC under the one-stop-shop mechanism."
            cite="— GDPR Art.56"
          />
        )}
      </div>

      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="thirdparty">Was anyone outside your organisation involved?</label>
        <select
          id="thirdparty"
          className="aegis-select"
          value={state.thirdParty}
          onChange={e => update("thirdParty", e.target.value as ThirdParty)}
        >
          <option value="">Choose one…</option>
          {(Object.keys(THIRD_PARTY_LABELS) as Array<keyof typeof THIRD_PARTY_LABELS>).map(k => (
            <option key={k} value={k}>{THIRD_PARTY_LABELS[k]}</option>
          ))}
        </select>

        {state.thirdParty === "processor" && (
          <Alert
            variant="warning"
            title="GDPR Art.33(2) — controller liability persists"
            body="Even where your data processor suffered the breach, you as data controller remain responsible for notifying the supervisory authority within 72 hours of becoming aware. Your processor agreement (DPA) should require the processor to notify you without undue delay. Check your contract now. The clock started when you became aware — not when the processor was breached."
            cite="— GDPR Art.33(1), Art.33(2)"
          />
        )}
      </div>

      <div className="aegis-card mb-8">
        <label className="aegis-label flex items-center gap-3" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={state.hlClient}
            onChange={e => update("hlClient", e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#1a56db" }}
          />
          Are you a Hogan Lovells or ELTEMATE client?
        </label>
        {state.hlClient && (
          <Alert
            variant="info"
            title="Hogan Lovells advisory team flagged"
            body="Your Hogan Lovells data protection advisory team has been flagged. A partner will be in contact within 2 hours to support your breach response."
          />
        )}
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <button className="aegis-btn-secondary" onClick={onBack} style={{ flex: "0 0 auto" }} disabled={loading}>
          ← Back
        </button>
        <button
          className="aegis-btn-primary"
          onClick={onNext}
          disabled={loading || !state.sector || !state.jurisdiction}
        >
          Next: legal context →
        </button>
      </div>
    </div>
  );
};
