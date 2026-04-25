import { FormState, AIAssessment, LDAResult, DPA_MAP } from "@/lib/aegis";
import { CoordinationBanner } from "./screen4/CoordinationBanner";
import { TechTrack } from "./screen4/TechTrack";
import { LegalTrack } from "./screen4/LegalTrack";

interface Props {
  state: FormState;
  ldaGdpr: LDAResult | null;
  ldaNis2: LDAResult | null;
  ldaDora: LDAResult | null;
  ldaConnected: boolean;
  ai: AIAssessment | null;
  aiError: boolean;
  auditLog: string[];
  onBack: () => void;
  onRestart: () => void;
}

export const Screen4 = ({
  state,
  ldaGdpr,
  ldaNis2,
  ldaDora,
  ldaConnected,
  ai,
  aiError,
  auditLog,
  onBack,
  onRestart,
}: Props) => {
  const dpaName = state.jurisdiction
    ? DPA_MAP[state.jurisdiction]
    : "your lead supervisory authority";

  return (
    <div className="mx-auto max-w-[1280px] p-8">
      <div className="aegis-section-label mb-2">Step 4 of 4</div>
      <h2 className="aegis-title mb-3">Assessment &amp; Action Plan</h2>
      <p className="aegis-helper mb-6">
        Two parallel response tracks. Tech team can act immediately; legal track loads as
        the AI completes drafting.
      </p>

      <CoordinationBanner />

      <div className="aegis-two-track grid gap-6 grid-cols-1 lg:grid-cols-[1fr_1px_1fr]">
        <TechTrack state={state} ai={ai} aiError={aiError} auditLog={auditLog} />

        <div className="aegis-track-divider hidden lg:block w-px bg-white/[0.08]" />

        <LegalTrack
          state={state}
          ai={ai}
          aiError={aiError}
          ldaConnected={ldaConnected}
          ldaGdpr={ldaGdpr}
          ldaNis2={ldaNis2}
          ldaDora={ldaDora}
          dpaName={dpaName}
        />
      </div>

      <div className="flex gap-3 flex-col sm:flex-row mt-10">
        <button className="aegis-btn-secondary" onClick={onBack}>
          ← Back to legal context
        </button>
        <button className="aegis-btn-primary" onClick={onRestart}>
          Start a new incident
        </button>
      </div>
    </div>
  );
};
