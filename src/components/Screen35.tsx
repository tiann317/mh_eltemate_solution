import { Alert } from "./Alert";
import { ValidationBanner } from "./ValidationBanner";
import { FieldExplainer } from "./FieldExplainer";
import type { StepErrors } from "@/lib/validation";
import {
  FormState, DpaStatus, CrossBorder, LegalPrivilege, NCA_MAP,
  isNIS2Sector, isFinancial, isCERSector, hasAnyPersonalData,
} from "@/lib/aegis";

interface Props {
  state: FormState;
  setState: (s: FormState) => void;
  errors?: StepErrors;
  onBack: () => void;
  onNext: () => void;
}

export const Screen35 = ({ state, setState, errors, onBack, onNext }: Props) => {
  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState({ ...state, [k]: v });

  const showProcessor = state.thirdParty === "processor" || state.thirdParty === "joint";
  const showNIS2 = isNIS2Sector(state.sector);
  const showDORA = isFinancial(state.sector);
  const showCER = isCERSector(state.sector);
  const showCrossBorderDetail = state.crossBorder === "yes";
  const showCounsel = state.legalPrivilege === "engaged";

  return (
    <div className="mx-auto" style={{ maxWidth: 760, padding: 32 }}>
      <ValidationBanner errors={errors} />
      <div className="aegis-section-label mb-2">Step 4 of 5</div>
      <h2 className="aegis-title mb-3">Legal context</h2>
      <p className="aegis-helper mb-8">
        Completed by: DPO or Legal counsel. Captures the statutory anchors that justify both the technical response (audit logs,
        evidence retention, containment) and the regulatory notifications. Tech and legal teams share this layer — every action
        the tech team takes from here on must be traceable to a legal basis.
      </p>

      {/* Controller identity — always */}
      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="controller">
          Controller (legal entity name)
        </label>
        <input
          id="controller"
          className="aegis-select"
          value={state.controllerName}
          onChange={e => update("controllerName", e.target.value)}
          placeholder="e.g. Acme Mobility GmbH"
        />
        <div className="aegis-field-helper">
          The data controller within the meaning of GDPR Art.4(7) — the entity that determines purposes and means of processing.
        </div>

        <label className="aegis-label mt-4" htmlFor="dpo">DPO contact</label>
        <input
          id="dpo"
          className="aegis-select"
          value={state.dpoContact}
          onChange={e => update("dpoContact", e.target.value)}
          placeholder="DPO name + email"
        />
        <div className="aegis-field-helper">Required for the Art.33(3)(b) notification — name and contact details of the DPO.</div>
      </div>

      {/* Processor / DPA clause — conditional */}
      {showProcessor && (
        <div className="aegis-card mb-6">
          <label className="aegis-label" htmlFor="processor">Processor name</label>
          <input
            id="processor"
            className="aegis-select"
            value={state.processorName}
            onChange={e => update("processorName", e.target.value)}
            placeholder="e.g. CloudVendor SAS"
          />

          <label className="aegis-label mt-4" htmlFor="dpaclause">Data Processing Agreement (Art.28) status</label>
          <select
            id="dpaclause"
            className="aegis-select"
            value={state.dpaClauseStatus}
            onChange={e => update("dpaClauseStatus", e.target.value as DpaStatus)}
          >
            <option value="">(select...)</option>
            <option value="in-place">DPA in place with breach-notification clause</option>
            <option value="missing">No DPA / no breach-notification clause</option>
            <option value="outdated">DPA outdated (pre-GDPR or pre-SCCs 2021)</option>
            <option value="unknown">Unknown</option>
          </select>

          {state.dpaClauseStatus === "missing" && (
            <Alert
              variant="danger"
              title="GDPR Art.28(3) gap — controller still bears Art.33 deadline"
              body="Without a compliant Art.28 DPA, the processor is under no contractual obligation to notify you 'without undue delay'. The 72-hour clock still runs against you as controller from the moment you became aware. Document this contractual gap in the audit log; it is itself an Art.32 organisational failure."
              cite="— GDPR Art.28(3)(f), Art.33(2)"
            />
          )}
          {state.dpaClauseStatus === "outdated" && (
            <Alert
              variant="warning"
              title="DPA may not satisfy current Art.28 standard"
              body="Pre-GDPR or pre-2021 SCC contracts often miss the breach-notification, audit and sub-processor flow-down clauses now required. Flag for legal review before relying on processor warranties."
              cite="— GDPR Art.28(3); EU Commission SCCs 2021/914"
            />
          )}
        </div>
      )}

      {/* Cross-border — always */}
      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="crossborder">Cross-border processing involved?</label>
        <select
          id="crossborder"
          className="aegis-select"
          value={state.crossBorder}
          onChange={e => update("crossBorder", e.target.value as CrossBorder)}
        >
          <option value="">(select...)</option>
          <option value="yes">Yes — affects individuals in multiple EU member states</option>
          <option value="no">No — single member state</option>
          <option value="unknown">Unknown</option>
        </select>
        <div className="aegis-field-helper">
          Determines whether the GDPR Art.56 one-stop-shop applies and which DPAs are "concerned authorities".
        </div>

        {showCrossBorderDetail && (
          <>
            <label className="aegis-label mt-4" htmlFor="ms">Affected EU member states</label>
            <input
              id="ms"
              className="aegis-select"
              value={state.affectedMemberStates}
              onChange={e => update("affectedMemberStates", e.target.value)}
              placeholder="e.g. DE, FR, NL, IT"
            />
            <Alert
              variant="info"
              title="One-stop-shop — lead DPA notifies concerned authorities"
              body="Under Art.56, your lead DPA coordinates with the DPAs of the listed member states. You file one Art.33 notification with the lead DPA; you do not file separately in each country."
              cite="— GDPR Art.56, Art.60"
            />
          </>
        )}
      </div>

      {/* NIS2 conditional */}
      {showNIS2 && (
        <div className="aegis-card mb-6">
          <label className="aegis-label" htmlFor="csirt">CSIRT / national competent authority contact</label>
          <select
            id="csirt"
            className="aegis-select"
            value={state.csirtContact}
            onChange={e => update("csirtContact", e.target.value)}
          >
            <option value="">(select EU member state CSIRT…)</option>
            {Object.entries(NCA_MAP)
              .sort(([, a], [, b]) => a.localeCompare(b))
              .map(([code, label]) => (
                <option key={code} value={label}>{label}</option>
              ))}
            <option value="other">Other / not listed — enter manually below</option>
          </select>
          {state.csirtContact === "other" && (
            <input
              className="aegis-select mt-2"
              value={state.csirtContact === "other" ? "" : state.csirtContact}
              onChange={e => update("csirtContact", e.target.value)}
              placeholder="e.g. sector-specific CSIRT, internal SOC contact"
            />
          )}
          <div className="aegis-field-helper">
            Pick the national CSIRT / competent authority for the member state where your service is established.
            For multi-country operations, file with the CSIRT of the member state of main establishment under NIS2 Art.26.
          </div>
          <Alert
            variant="warning"
            title="NIS2 dual-track notification"
            body="As an essential or important entity, you must submit (a) an early warning to your CSIRT within 24 hours of awareness, and (b) a formal incident notification within 72 hours. This is in addition to — and goes to a different authority than — your GDPR Art.33 DPA notification."
            cite="— NIS2 Directive 2022/2555, Art.23(4)"
          />
        </div>
      )}

      {/* DORA conditional */}
      {showDORA && (
        <div className="aegis-card mb-6">
          <label className="aegis-label" htmlFor="ict">ICT third-party service provider involved</label>
          <input
            id="ict"
            className="aegis-select"
            value={state.ictThirdParty}
            onChange={e => update("ictThirdParty", e.target.value)}
            placeholder="e.g. AWS Frankfurt, none, in-house only"
          />
          <Alert
            variant="danger"
            title="DORA Art.28 — ICT third-party register required"
            body="If a critical ICT third-party provider is implicated, your Register of Information must reflect this incident, and your contractual right-to-audit and exit strategy clauses (Art.30) must be exercisable. Confirm with vendor management within the 4-hour initial-report window."
            cite="— DORA Reg. 2022/2554, Art.28, Art.30"
          />
        </div>
      )}

      {/* CER conditional */}
      {showCER && (
        <div className="aegis-card mb-6">
          <label className="aegis-label flex items-center gap-3" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={state.cerOperator}
              onChange={e => update("cerOperator", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#1a56db" }}
            />
            We are designated as a critical entity under the CER Directive
          </label>
          {state.cerOperator && (
            <Alert
              variant="warning"
              title="CER Art.15 — incident notification to competent authority"
              body="Designated critical entities must notify their CER competent authority of incidents that significantly disrupt or have the potential to significantly disrupt the provision of essential services. This runs in parallel to NIS2 and is governed by separate national implementing law."
              cite="— CER Directive 2022/2557, Art.15"
            />
          )}
        </div>
      )}

      {/* Legal privilege — always */}
      <div className="aegis-card mb-6">
        <label className="aegis-label" htmlFor="privilege">Legal privilege posture</label>
        <select
          id="privilege"
          className="aegis-select"
          value={state.legalPrivilege}
          onChange={e => update("legalPrivilege", e.target.value as LegalPrivilege)}
        >
          <option value="">(select...)</option>
          <option value="engaged">Outside counsel engaged — investigation under privilege</option>
          <option value="not-engaged">No outside counsel — investigation in-house only</option>
          <option value="unknown">Unknown / to be decided</option>
        </select>
        <div className="aegis-field-helper">
          Privilege posture affects how forensic findings are documented and disclosed. Privilege protections are jurisdiction-specific
          in the EU and do not extend to in-house counsel in all member states (e.g. CJEU AKZO Nobel, C-550/07 P).
        </div>

        {showCounsel && (
          <>
            <label className="aegis-label mt-4" htmlFor="counsel">Outside counsel firm</label>
            <input
              id="counsel"
              className="aegis-select"
              value={state.outsideCounsel}
              onChange={e => update("outsideCounsel", e.target.value)}
              placeholder="e.g. Hogan Lovells — Munich"
            />
          </>
        )}
        {state.legalPrivilege === "not-engaged" && hasAnyPersonalData(state.dataCategories) && (
          <Alert
            variant="warning"
            title="Consider engaging external counsel before forensic write-up"
            body="Internal forensic reports may become disclosable in regulatory investigations or follow-on litigation. Engaging external counsel before investigation findings are reduced to writing is a common protective practice."
          />
        )}
      </div>

      {/* Retention basis — always */}
      <div className="aegis-card mb-8">
        <label className="aegis-label" htmlFor="retention">
          Stated legal basis for evidence / audit-log retention during this incident
        </label>
        <FieldExplainer
          term="Legal basis for evidence retention"
          plain="When responders save logs, disk images, memory dumps or screenshots that contain personal data (IP addresses, usernames, email content), GDPR treats that as a new processing activity that needs its own lawful basis. Stating it here makes every later technical action defensible in a regulator audit."
          examples="‘Art.6(1)(c) — legal obligation to document the breach (Art.33(5))’, ‘Art.6(1)(f) — legitimate interest in network/info security (Recital 49)’, or your own internal Records of Processing reference."
          cite="GDPR Art.5(1)(b), Art.6, Art.32, Art.33(5)"
        />
        <input
          id="retention"
          className="aegis-select mt-2"
          value={state.retentionBasis}
          onChange={e => update("retentionBasis", e.target.value)}
          placeholder="e.g. GDPR Art.6(1)(c) + Art.33(5) — legal obligation to document"
        />
        <div className="aegis-field-helper">
          The tech team will be retaining logs, snapshots and forensic images that may themselves contain personal data.
          Art.33(5) requires the controller to document any breach; Art.5(1)(b) (purpose limitation) and Art.6 require a lawful
          basis for that retention. State the basis here so the tech actions are auditable.
        </div>
        <Alert
          variant="info"
          title="Default basis if blank: GDPR Art.6(1)(c) + Art.33(5)"
          body="If no specific basis is entered, Aegis Notice will record the audit-log retention as resting on the controller's legal obligation to document the breach (Art.33(5)) and the security-of-processing duty (Art.32). This is auto-applied to every tech action shown on the next screen."
        />
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <button className="aegis-btn-secondary" onClick={onBack} style={{ flex: "0 0 auto" }}>← Back</button>
        <button
          className="aegis-btn-primary"
          onClick={onNext}
          disabled={!state.crossBorder || !state.legalPrivilege}
        >
          Generate assessment →
        </button>
      </div>
    </div>
  );
};
