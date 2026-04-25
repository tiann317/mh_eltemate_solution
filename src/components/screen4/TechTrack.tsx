import { FormState, AIAssessment, normalizeAction, buildPrioritizedPlan } from "@/lib/aegis";
import PrioritizedActionPlan from "@/components/PrioritizedActionPlan";
import { ClockDisplay } from "./ClockDisplay";
import { TechChecklist } from "./TechChecklist";
import { ColumnHeader, SectionLabel } from "./SectionLabel";
import { computeVerdict, verdictClass, buildClocks } from "./verdict";

interface Props {
  state: FormState;
  ai: AIAssessment | null;
  aiError: boolean;
  auditLog: string[];
}

export const TechTrack = ({ state, ai, aiError, auditLog }: Props) => {
  const verdict = computeVerdict(state);
  const clocks = buildClocks(state);
  const legalLoading = !ai && !aiError;

  const discoveredMs = state.discoveryTime
    ? new Date(state.discoveryTime).getTime()
    : Date.now();
  const plan = buildPrioritizedPlan(state, ai, discoveredMs, []);

  return (
    <div>
      <ColumnHeader
        kicker="TECH TRACK"
        kickerColor="#63AFF0"
        sub="Actions for your InfoSec and IT team"
      />

      <div className={`aegis-card ${verdictClass(verdict.level)}`}>
        <div className="text-lg font-light tracking-widest uppercase text-white mb-2">
          {verdict.label}
        </div>
        <div className="text-muted-foreground text-[13px] leading-7">{verdict.basis}</div>
      </div>

      <SectionLabel>Prioritized action plan (urgency order)</SectionLabel>
      {plan.length === 0 ? (
        <div className="aegis-card aegis-helper">
          Action plan will appear once the assessment completes.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-3.5">
          <PrioritizedActionPlan actions={plan} showHeader={false} />
          <div className="mt-2.5 text-[11px] text-slate-600 leading-snug">
            Mark-done and oversight actions are recorded in the incident audit log on the
            dashboard. Open this incident from the dashboard to persist completions.
          </div>
        </div>
      )}

      <SectionLabel>Active regulatory clocks</SectionLabel>
      {clocks.length === 0 ? (
        <div className="aegis-card aegis-helper">
          No clocks active for the selected inputs.
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-1">
            {clocks.map((c, i) => (
              <ClockDisplay key={i} clock={c} discovery={state.discoveryTime} />
            ))}
          </div>
          {!state.discoveryTime && (
            <div className="aegis-helper mt-2 text-xs">
              Enter discovery time in Step 1 to start clocks.
            </div>
          )}
        </>
      )}

      <SectionLabel>Immediate technical actions</SectionLabel>
      {legalLoading ? (
        <div className="aegis-card aegis-helper">Awaiting AI checklist…</div>
      ) : aiError || !ai ? (
        <div className="aegis-card aegis-helper">
          No checklist available — AI assessment failed.
        </div>
      ) : (
        <TechChecklist items={(ai.recommended_actions ?? []).map(normalizeAction)} />
      )}

      <SectionLabel>Incident audit log</SectionLabel>
      <div className="bg-black/30 border border-white/10 rounded-sm p-4 font-mono text-[11px] text-muted-foreground leading-7 max-h-80 overflow-y-auto whitespace-pre-wrap">
        {auditLog.join("\n")}
      </div>
    </div>
  );
};
