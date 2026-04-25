import { FormState, AIAssessment, LDAResult, normalizeAction } from "@/lib/aegis";
import { SourcedCard } from "./SourcedCard";
import { CopyButton } from "./CopyButton";
import { RiskMatrix } from "./RiskMatrix";
import { ColumnHeader, SectionLabel } from "./SectionLabel";

interface Props {
  state: FormState;
  ai: AIAssessment | null;
  aiError: boolean;
  ldaConnected: boolean;
  ldaGdpr: LDAResult | null;
  ldaNis2: LDAResult | null;
  ldaDora: LDAResult | null;
  dpaName: string;
}

const LegalLoading = () => (
  <div className="aegis-card text-center p-12">
    <div className="w-7 h-7 rounded-full border-[3px] border-white/10 border-t-emerald-400 mx-auto mb-4 animate-spin" />
    <div className="text-muted-foreground text-[13px]">AI is preparing legal track…</div>
  </div>
);

const LegalError = () => (
  <div className="aegis-card border-l-[3px] border-l-red-400">
    <div className="text-red-400 font-semibold mb-1.5">
      Legal track could not be generated
    </div>
    <div className="text-muted-foreground text-[13px]">
      The LDA Legal Data Hub assessment could not be generated. The credentials may be
      invalid, the LDA chat endpoint may have timed out, or the response may not have
      parsed as JSON. Please retry.
    </div>
  </div>
);

const LDADisconnected = () => (
  <div className="aegis-card border-l-[3px] border-l-amber-400 bg-amber-400/[0.06]">
    <div className="text-amber-400 font-semibold mb-1.5 flex items-center gap-2">
      <span>⚠</span> Legal database (LDA) not connected
    </div>
    <div className="text-muted-foreground text-[13px] leading-relaxed">
      The AI assessment above was generated{" "}
      <strong className="text-white">without cited legal sources</strong> from the Otto
      Schmidt Legal Data Hub. Statutory references shown are model-generated and should
      be verified by counsel before relying on them.
      <div className="mt-1.5 text-slate-400 text-xs">
        To enable sourced guidance, add the <code>LDA</code> backend secret (format{" "}
        <code>client_id:client_secret</code>).
      </div>
    </div>
  </div>
);

const DraftCard = ({ title, sub, body }: { title: string; sub?: string; body: string }) => (
  <div className="aegis-card mb-4 relative">
    <div className="text-white text-[13px] font-medium mb-1 pr-[70px]">{title}</div>
    {sub && <div className="text-muted-foreground text-[11px] mb-2.5">{sub}</div>}
    <CopyButton text={body} />
    <div className="aegis-draft">{body}</div>
  </div>
);

export const LegalTrack = ({
  state,
  ai,
  aiError,
  ldaConnected,
  ldaGdpr,
  ldaNis2,
  ldaDora,
  dpaName,
}: Props) => {
  const legalLoading = !ai && !aiError;

  return (
    <div>
      <ColumnHeader
        kicker="LEGAL TRACK"
        kickerColor="#52D68A"
        sub="Submitted to lawyers — AI-assisted"
      />

      {legalLoading && <LegalLoading />}
      {!legalLoading && (aiError || !ai) && <LegalError />}

      {!legalLoading && ai && (
        <>
          <SectionLabel>AI risk assessment</SectionLabel>
          <div className="aegis-card relative">
            <span className="absolute top-3 right-3 bg-emerald-900/40 border border-emerald-400 text-emerald-400 text-[10px] px-2 py-0.5 rounded-sm tracking-wider uppercase">
              Submitted to lawyers
            </span>
            <div className="text-muted-foreground text-[13px] leading-7 pr-36">
              {ai.risk_assessment}
            </div>
            {ai.key_gaps?.length > 0 && (
              <>
                <div className="text-white text-[13px] font-medium mt-3.5 mb-1.5">
                  Information gaps that would change this assessment:
                </div>
                <ul className="pl-5 m-0">
                  {ai.key_gaps.map((g, i) => (
                    <li key={i} className="text-amber-400 text-xs leading-7">
                      {g}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <SectionLabel>Law layer</SectionLabel>
          {!ldaConnected ? (
            <LDADisconnected />
          ) : (
            <>
              {ldaGdpr && (
                <SourcedCard
                  heading="GDPR Art.33 / 34 — sourced legal guidance"
                  result={ldaGdpr}
                />
              )}
              {ldaNis2 && (
                <SourcedCard
                  heading="NIS2 Art.23 — sourced legal guidance"
                  result={ldaNis2}
                />
              )}
              {ldaDora && (
                <SourcedCard
                  heading="DORA Art.19 — sourced legal guidance"
                  result={ldaDora}
                />
              )}
            </>
          )}

          <SectionLabel>Tech actions → legal basis (audit mirror)</SectionLabel>
          <div className="aegis-card p-0 overflow-hidden">
            <div className="grid grid-cols-[1.6fr_1fr] bg-emerald-400/[0.08] border-b border-white/[0.08] px-3.5 py-2.5 text-[10px] tracking-wider uppercase text-emerald-400 font-semibold">
              <div>Tech action</div>
              <div>Statutory anchor</div>
            </div>
            {(ai.recommended_actions ?? []).map(normalizeAction).map((a, i, arr) => (
              <div
                key={i}
                className={`grid grid-cols-[1.6fr_1fr] px-3.5 py-2.5 text-xs leading-snug ${
                  i < arr.length - 1 ? "border-b border-white/[0.05]" : ""
                }`}
              >
                <div className="text-muted-foreground pr-3">{a.action}</div>
                <div>
                  <div className="inline-block font-mono text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/[0.35] px-1.5 py-0.5 rounded-sm mb-1">
                    {a.legal_basis}
                  </div>
                  <div className="text-white/50 text-[11px]">{a.rationale}</div>
                </div>
              </div>
            ))}
            <div className="px-3.5 py-2.5 bg-white/[0.02] border-t border-white/[0.08] text-[11px] text-white/50 leading-snug">
              Audit-log retention basis (org-stated):{" "}
              <span className="text-muted-foreground">
                {state.retentionBasis ||
                  "GDPR Art.6(1)(c) + Art.33(5) + Art.32 (default)"}
              </span>
            </div>
          </div>

          {ai.lawyer_packet && (
            <>
              <SectionLabel>Lawyer packet (structured)</SectionLabel>
              <div className="aegis-card">
                <div className="text-white text-[13px] font-medium mb-1.5">
                  Incident summary
                </div>
                <div className="text-muted-foreground text-[13px] leading-relaxed mb-3.5">
                  {ai.lawyer_packet.incident_summary}
                </div>

                <div className="text-white text-[13px] font-medium mb-1.5">
                  Frameworks triggered
                </div>
                <div className="mb-3.5 flex flex-wrap gap-1.5">
                  {ai.lawyer_packet.frameworks_triggered.map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-sm bg-sky-400/[0.12] text-sky-400 border border-sky-400/40"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div className="text-white text-[13px] font-medium mb-1.5">
                  Active deadlines
                </div>
                <ul className="pl-5 m-0 mb-3.5">
                  {ai.lawyer_packet.active_deadlines.map((d, i) => (
                    <li
                      key={i}
                      className="text-muted-foreground text-xs leading-7"
                    >
                      <strong className="text-white">{d.framework}</strong> — {d.deadline}{" "}
                      <span className="text-amber-400">({d.status})</span>
                    </li>
                  ))}
                </ul>

                <div className="text-white text-[13px] font-medium mb-1.5">
                  Decisions needed from counsel
                </div>
                <ul className="pl-5 m-0 mb-3.5">
                  {ai.lawyer_packet.decisions_needed.map((d, i) => (
                    <li key={i} className="text-muted-foreground text-xs leading-7">
                      {d}
                    </li>
                  ))}
                </ul>

                <div className="text-white text-[13px] font-medium mb-1.5">
                  Privilege posture
                </div>
                <div className="text-muted-foreground text-xs leading-relaxed mb-3.5">
                  {ai.lawyer_packet.privilege_note}
                </div>

                <div className="text-white text-[13px] font-medium mb-1.5">
                  Open questions
                </div>
                <ul className="pl-5 m-0">
                  {ai.lawyer_packet.open_questions.map((q, i) => (
                    <li key={i} className="text-amber-400 text-xs leading-7">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <SectionLabel>Risk matrix</SectionLabel>
          <div className="aegis-card">
            <RiskMatrix s={state} />
          </div>

          <SectionLabel>Draft notifications</SectionLabel>
          <DraftCard
            title="Draft A — Supervisory authority — GDPR Art.33"
            sub={`Addressed to: ${dpaName}`}
            body={ai.notification_draft}
          />
          <DraftCard
            title="Draft B — Internal escalation — CISO / CEO"
            body={ai.internal_alert}
          />
          <DraftCard
            title="Draft C — Lawyer handoff summary"
            body={ai.lawyer_handoff ?? "(not generated)"}
          />
        </>
      )}
    </div>
  );
};
