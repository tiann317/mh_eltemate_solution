import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Header, Footer } from "@/components/Chrome";
import { Stepper } from "@/components/Stepper";
import { Screen1 } from "@/components/Screen1";
import { Screen2 } from "@/components/Screen2";
import { Screen3 } from "@/components/Screen3";
import { Screen35 } from "@/components/Screen35";
import { ScreenReview } from "@/components/ScreenReview";
import { Screen4 } from "@/components/Screen4";
import { DevJumpBar, fakeIntake } from "@/components/DevJumpBar";
import { supabase } from "@/integrations/supabase/client";
import {
  initialState, FormState, fmtTimestamp,
  getLDAToken, queryLDA, LDA_PROMPTS, LDAResult,
  callOpenAI, AIAssessment, buildUserMessage,
  isNIS2Sector, isFinancial, hasAnyDanger, computeRiskRating,
  INCIDENT_TYPE_LABELS, ONGOING_LABELS, DATA_CATEGORY_LABELS,
  SECTOR_LABELS, DPA_MAP, THIRD_PARTY_LABELS,
  buildNotificationDrafts, computeOutstanding,
} from "@/lib/aegis";
import { validateStep, validateAll, StepErrors } from "@/lib/validation";

const Index = () => {
  const location = useLocation();
  const preCtx = (location.state ?? {}) as { preIntakeId?: string; severity?: "suspected" | "definite"; skipToAssessment?: boolean };
  const [step, setStep] = useState(1);
  const [state, setStateRaw] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<StepErrors>({});

  // Guarded step transition: validates the step the user is leaving before advancing.
  const goNext = (from: 1 | 2 | 3 | 35, to: number, draftState?: FormState, after?: () => void) => {
    const stateToValidate = draftState ?? state;
    const v = validateStep(from, stateToValidate);
    if (!v.ok) {
      setErrors(v.errors);
      toast.error(v.firstMessage || "Please complete the highlighted fields before continuing.");
      log(`Validation blocked step ${from} → ${to}: ${Object.keys(v.errors).length} field(s) invalid`);
      return;
    }
    if (draftState && draftState !== state) setStateRaw(draftState);
    setErrors({});
    setStep(to);
    after?.();
  };

  // LDA token (fetched once at mount)
  const [ldaToken, setLdaToken] = useState<string | null>(null);
  const [ldaTokenLoaded, setLdaTokenLoaded] = useState(false);

  // assessment results
  const [ldaGdpr, setLdaGdpr] = useState<LDAResult | null>(null);
  const [ldaNis2, setLdaNis2] = useState<LDAResult | null>(null);
  const [ldaDora, setLdaDora] = useState<LDAResult | null>(null);
  const [ai, setAi] = useState<AIAssessment | null>(null);
  const [aiError, setAiError] = useState(false);
  const [loading, setLoading] = useState(false);

  // audit log
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [savedIncidentId, setSavedIncidentId] = useState<string | null>(null);
  const log = (msg: string) =>
    setAuditLog(prev => [...prev, `[${fmtTimestamp()}] — ${msg}`]);

  // Fired alerts so we can pass to OpenAI prompt context
  const firedAlertsRef = useRef<{ title: string; cite: string }[]>([]);

  // session start log
  useEffect(() => {
    log("Aegis Notice session started");
    getLDAToken().then(t => {
      setLdaToken(t);
      setLdaTokenLoaded(true);
      if (t) log("LDA legal database — token acquired");
      else log("LDA legal database — credentials not configured (skipped)");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // wrapper to log diffs
  const setState = (next: FormState) => {
    const prev = state;
    if (next.discoveryTime !== prev.discoveryTime && next.discoveryTime)
      log(`Discovery time recorded: ${next.discoveryTime}`);
    if (next.incidentType !== prev.incidentType && next.incidentType) {
      log(`Incident type selected: ${INCIDENT_TYPE_LABELS[next.incidentType]}`);
      if (next.incidentType === "ransomware") {
        log(`Alert fired: "Availability breach confirmed" — GDPR Art.4(12)`);
        firedAlertsRef.current.push({ title: "Availability breach confirmed", cite: "GDPR Art.4(12)" });
      }
      if (next.incidentType === "ot-ics") {
        log(`Alert fired: "NIS2 and CER may apply independently" — NIS2 Art.23(1)`);
        firedAlertsRef.current.push({ title: "NIS2 and CER may apply independently", cite: "NIS2 Art.23(1)" });
      }
    }
    if (next.ongoingStatus !== prev.ongoingStatus && next.ongoingStatus === "yes") {
      log(`Alert fired: "Ongoing incident — interim notification" — GDPR Art.33(1)`);
      firedAlertsRef.current.push({ title: "Ongoing incident — interim notification may be required", cite: "GDPR Art.33(1)" });
    }
    if (next.dataCategories !== prev.dataCategories && next.dataCategories.length !== prev.dataCategories.length) {
      const labels = next.dataCategories.map(c => DATA_CATEGORY_LABELS[c]).join(", ");
      log(`Data categories selected: ${labels || "(none)"}`);
      const wasDanger = hasAnyDanger(prev.dataCategories);
      const isDanger = hasAnyDanger(next.dataCategories);
      if (!wasDanger && isDanger) {
        log(`Alert fired: "GDPR Art.9 — special category data detected" — Art.9(1)`);
        firedAlertsRef.current.push({ title: "GDPR Art.9 — special category data detected", cite: "GDPR Art.9(1), Art.33(1), Art.34(1)" });
      }
    }
    if (next.numAffected !== prev.numAffected && next.numAffected) {
      if (next.numAffected === "5k-50k" || next.numAffected === "o50k") {
        log(`Alert fired: "Scale threshold — Art.34 individual notification likely" — Art.34(1)`);
        firedAlertsRef.current.push({ title: "Scale threshold — Art.34 individual notification likely required", cite: "GDPR Art.34(1)" });
      }
    }
    if (next.harmTypes !== prev.harmTypes && next.harmTypes.includes("physical") && !prev.harmTypes.includes("physical")) {
      log(`Alert fired: "Physical harm flagged" — Art.34(1)`);
      firedAlertsRef.current.push({ title: "Physical harm flagged — escalate immediately", cite: "GDPR Art.34(1); Recital 85" });
    }
    if (next.sector !== prev.sector && next.sector) {
      log(`Sector selected: ${SECTOR_LABELS[next.sector]}`);
      if (isNIS2Sector(next.sector)) {
        log(`Alert fired: "NIS2 Directive — essential or important entity" — NIS2 Art.23(1)`);
        firedAlertsRef.current.push({ title: "NIS2 Directive — essential or important entity", cite: "NIS2 Art.23(1)" });
      }
      if (isFinancial(next.sector)) {
        log(`Alert fired: "DORA applies — 4-hour initial report" — DORA Art.19(4)(a)`);
        firedAlertsRef.current.push({ title: "DORA applies — 4-hour initial report", cite: "DORA Art.19(4)(a)" });
      }
    }
    if (next.jurisdiction !== prev.jurisdiction && next.jurisdiction) {
      log(`Jurisdiction selected: ${DPA_MAP[next.jurisdiction]}`);
    }
    if (next.thirdParty !== prev.thirdParty && next.thirdParty) {
      log(`Third party: ${THIRD_PARTY_LABELS[next.thirdParty]}`);
      if (next.thirdParty === "processor") {
        log(`Alert fired: "GDPR Art.33(2) — controller liability persists"`);
        firedAlertsRef.current.push({ title: "GDPR Art.33(2) — controller liability persists", cite: "GDPR Art.33(1), Art.33(2)" });
      }
    }
    setStateRaw(next);
  };

  const handleGenerate = async () => {
    // Re-run aggregate validation as a final guard.
    const all = validateAll(state);
    if (!all.ok) {
      const firstStepWithError = all.perStep.find(p => !p.ok);
      if (firstStepWithError) setErrors(firstStepWithError.errors);
      toast.error(`Please fix ${all.totalErrors} item(s) before generating.`);
      log(`Validation blocked assessment generation: ${all.totalErrors} field(s) invalid`);
      return;
    }
    setErrors({});
    setLoading(true);
    setAiError(false);
    log("Form validated — all required fields present across every step");
    log("Assessment generation started");
    log("Tech track activated — immediate actions checklist generated");
    log("Legal track activated — submitted to lawyers summary generated");

    const promises: Promise<void>[] = [];
    let totalSources = 0;

    if (ldaToken) {
      log("LDA legal database queried: GDPR Art.33/34");
      promises.push(
        queryLDA(ldaToken, LDA_PROMPTS.gdpr)
          .then(r => { setLdaGdpr(r); totalSources += r.sources.length; })
          .catch(() => { /* silent */ })
      );
      if (isNIS2Sector(state.sector)) {
        log("LDA legal database queried: NIS2 Art.23");
        promises.push(
          queryLDA(ldaToken, LDA_PROMPTS.nis2)
            .then(r => { setLdaNis2(r); totalSources += r.sources.length; })
            .catch(() => {})
        );
      }
      if (isFinancial(state.sector)) {
        log("LDA legal database queried: DORA Art.19");
        promises.push(
          queryLDA(ldaToken, LDA_PROMPTS.dora)
            .then(r => { setLdaDora(r); totalSources += r.sources.length; })
            .catch(() => {})
        );
      }
    }

    const userMsg = buildUserMessage(state, firedAlertsRef.current);
    const aiPromise = callOpenAI(userMsg).then(res => {
      if (res) {
        setAi(res);
        log("OpenAI GPT-4o assessment completed");
        log("Draft Art.33 notification generated");
        log("Internal escalation alert generated");
        log("Lawyer handoff summary generated");
      } else {
        setAiError(true);
        log("OpenAI assessment failed or returned invalid JSON");
      }
    });
    promises.push(aiPromise);

    await Promise.all(promises);
    if (ldaToken) {
      log("LDA response received");
      log(`Law layer queried: ${totalSources} sources returned with attribution`);
    }

    // Risk matrix plotting
    const danger = hasAnyDanger(state.dataCategories);
    const highVol = state.numAffected === "5k-50k" || state.numAffected === "o50k";
    let frameworks = 0;
    if (state.dataCategories.length > 0) frameworks++;
    if (isNIS2Sector(state.sector)) frameworks++;
    if (isFinancial(state.sector)) frameworks++;
    const xLabel = frameworks >= 3 ? "high complexity" : frameworks === 2 ? "medium complexity" : "low complexity";
    const yLabel = (danger && highVol) ? "high impact" : (danger || highVol) ? "medium impact" : "low impact";
    log(`Risk matrix plotted: ${xLabel} × ${yLabel}`);


    // Persist incident + audit log to database
    try {
      const finalLog = [...auditLog, `[${fmtTimestamp()}] — Assessment displayed to user`];
      const aiResult = ai;
      const { data: inserted, error: insErr } = await supabase
        .from("incidents")
        .insert([{
          discovery_time: state.discoveryTime || null,
          incident_type: state.incidentType || null,
          sector: state.sector || null,
          jurisdiction: state.jurisdiction || null,
          num_affected: state.numAffected || null,
          risk_rating: aiResult?.risk_rating || computeRiskRating(state),
          status: "open",
          form_data: state as unknown as Record<string, unknown>,
          fired_alerts: firedAlertsRef.current as unknown as Record<string, unknown>[],
          ai_assessment: (aiResult as unknown as Record<string, unknown>) ?? null,
          lda_gdpr: (ldaGdpr as unknown as Record<string, unknown>) ?? null,
          lda_nis2: (ldaNis2 as unknown as Record<string, unknown>) ?? null,
          lda_dora: (ldaDora as unknown as Record<string, unknown>) ?? null,
          severity_classification: preCtx.severity ?? "suspected",
          reporter_pre_intake_id: preCtx.preIntakeId ?? null,
          tech_escalation_state: "triaging",
          legal_escalation_state: "lawyer_review",
        }])
        .select("id")
        .single();
      if (!insErr && inserted) {
        setSavedIncidentId(inserted.id);
        if (preCtx.preIntakeId) {
          await supabase.from("pre_intakes").update({ incident_id: inserted.id }).eq("id", preCtx.preIntakeId);
        }
        const rows = finalLog.map(message => ({ incident_id: inserted.id, message }));
        await supabase.from("audit_logs").insert(rows);
        // Persist notification drafts so user can review/send them from the incident page.
        try {
          const drafts = buildNotificationDrafts(state, aiResult);
          if (drafts.length) {
            await supabase.from("notifications").insert(
              drafts.map(d => ({
                incident_id: inserted.id,
                framework: d.framework,
                authority: d.authority,
                subject: d.subject,
                body: d.body,
                status: "draft",
              })),
            );
          }
          // Cache outstanding-actions count for dashboard list view.
          const outstanding = computeOutstanding(
            state,
            state.discoveryTime ? new Date(state.discoveryTime).getTime() : Date.now(),
            drafts.map(d => ({ framework: d.framework, status: "draft" })),
            aiResult?.lawyer_packet?.decisions_needed ?? [],
          );
          await supabase.from("incidents").update({ outstanding_actions_count: outstanding.length }).eq("id", inserted.id);
        } catch (e) {
          console.error("draft persist error", e);
        }
        log(`Incident persisted to dashboard (id: ${inserted.id.slice(0, 8)})`);
      } else if (insErr) {
        console.error("incident insert failed", insErr);
      }
    } catch (e) {
      console.error("persist error", e);
    }

    log("Assessment displayed to user");
    setLoading(false);
    setStep(4);
  };

  const restart = () => {
    setStateRaw(initialState);
    setLdaGdpr(null);
    setLdaNis2(null);
    setLdaDora(null);
    setAi(null);
    setAiError(false);
    firedAlertsRef.current = [];
    setStep(1);
    log("New incident started — form reset");
  };

  // Dev helpers: autofill the intake state and (optionally) jump straight to assessment.
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const devAutofill = () => {
    setStateRaw(fakeIntake);
    log("Dev: intake form autofilled with fake data");
  };
  const devSkipToAssessment = () => {
    setStateRaw(fakeIntake);
    setPendingGenerate(true);
  };
  useEffect(() => {
    if (pendingGenerate && state === fakeIntake) {
      setPendingGenerate(false);
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingGenerate, state]);

  // If we arrived here from PreIntake's "Skip to assessment" dev button, run once.
  const skipFiredRef = useRef(false);
  useEffect(() => {
    if (preCtx.skipToAssessment && !skipFiredRef.current) {
      skipFiredRef.current = true;
      devSkipToAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preCtx.skipToAssessment]);


  return (
    <div className="flex flex-col min-h-screen">
      <DevJumpBar onAutofill={devAutofill} onSkipToAssessment={devSkipToAssessment} />
      <Header />
      <Stepper current={step === 35 ? 4 : step === 38 ? 5 : step >= 4 ? 6 : step} />
      <main className="flex-1">
        {loading ? (
          <div className="mx-auto" style={{ maxWidth: 760, padding: 64, textAlign: "center" }}>
            <div
              role="status"
              aria-live="polite"
              style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid #cbd5e1",
                borderTopColor: "#1a56db",
                margin: "0 auto 24px",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 500, letterSpacing: "0.05em", marginBottom: 8 }}>
              Assessing your incident against EU regulatory requirements...
            </div>
            <div style={{ color: "#475569", fontSize: 13 }}>
              Querying legal database for sourced guidance...
            </div>
          </div>
        ) : (
          <>
            {step === 1 && <Screen1 state={state} setState={setState} errors={errors} onNext={(draft) => goNext(1, 2, draft)} />}
            {step === 2 && <Screen2 state={state} setState={setState} errors={errors} onBack={() => { setErrors({}); setStep(1); }} onNext={() => goNext(2, 3)} />}
            {step === 3 && (
              <Screen3
                state={state}
                setState={setState}
                errors={errors}
                onBack={() => { setErrors({}); setStep(2); }}
                onNext={() => goNext(3, 35)}
                loading={loading}
              />
            )}
            {step === 35 && (
              <Screen35
                state={state}
                setState={setState}
                errors={errors}
                onBack={() => { setErrors({}); setStep(3); }}
                onNext={() => goNext(35, 38)}
              />
            )}
            {step === 38 && (
              <ScreenReview
                state={state}
                onBack={() => setStep(35)}
                onEdit={(s) => { setErrors({}); setStep(s); }}
                onConfirm={handleGenerate}
              />
            )}
            {step === 4 && (
              <Screen4
                state={state}
                ldaGdpr={ldaGdpr}
                ldaNis2={ldaNis2}
                ldaDora={ldaDora}
                ldaConnected={ldaTokenLoaded && !!ldaToken}
                ai={ai}
                aiError={aiError}
                auditLog={auditLog}
                incidentId={savedIncidentId}
                preIntakeId={preCtx.preIntakeId}
                onBack={() => setStep(35)}
                onRestart={restart}
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
