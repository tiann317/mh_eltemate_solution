import { useEffect, useMemo, useState } from "react";
import {
  FormState, AIAssessment, LDAResult, LDASource, DPA_MAP,
  RecommendedAction, normalizeAction,
  hasAnyDanger, hasAnyPersonalData, isNIS2Sector, isFinancial,
  buildPrioritizedPlan,
} from "@/lib/aegis";
import PrioritizedActionPlan from "@/components/PrioritizedActionPlan";

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

type Verdict = { level: "likely" | "possibly" | "unlikely"; label: string; basis: string };

const computeVerdict = (s: FormState): Verdict => {
  const danger = hasAnyDanger(s.dataCategories);
  const highVol = s.numAffected === "5k-50k" || s.numAffected === "o50k";
  const physical = s.harmTypes.includes("physical");
  const ransom = s.incidentType === "ransomware";

  if (danger || highVol || physical || ransom) {
    const reasons: string[] = [];
    if (danger) reasons.push("special category data under GDPR Art.9");
    if (highVol) reasons.push("high volume of affected individuals");
    if (physical) reasons.push("risk of physical harm");
    if (ransom) reasons.push("ransomware availability breach (Art.4(12))");
    return {
      level: "likely",
      label: "Likely notifiable",
      basis: `Triggered by: ${reasons.join("; ")}. Art.33 notification to the supervisory authority is required within 72 hours of discovery; Art.34 individual notification is likely required.`,
    };
  }
  if (hasAnyPersonalData(s.dataCategories)) {
    return {
      level: "possibly",
      label: "Possibly notifiable",
      basis: "Personal data is involved but no clear high-risk indicators have been triggered. Conduct a documented Art.33 risk assessment; if the breach is unlikely to result in risk to the rights and freedoms of natural persons, notification may not be required — but document the rationale.",
    };
  }
  return {
    level: "unlikely",
    label: "Notification unlikely required",
    basis: "Based on the inputs provided, no personal data appears to be involved. NIS2 / DORA / sectoral obligations may still apply — review framework section below.",
  };
};

const verdictStyle = (v: Verdict["level"]): React.CSSProperties => {
  if (v === "likely") return { borderLeft: "4px solid #ff6b6b", background: "rgba(192,57,43,0.15)" };
  if (v === "possibly") return { borderLeft: "4px solid #ffc46b", background: "rgba(180,100,0,0.15)" };
  return { borderLeft: "4px solid #52d68a", background: "rgba(13,59,34,0.15)" };
};

interface Clock { label: string; sub: string; hours: number }

const buildClocks = (s: FormState): Clock[] => {
  const cs: Clock[] = [];
  if (hasAnyPersonalData(s.dataCategories)) {
    cs.push({ label: "GDPR Art.33 — supervisory authority", sub: "72-hour deadline", hours: 72 });
  }
  if (isNIS2Sector(s.sector)) {
    cs.push({ label: "NIS2 Art.23 — early warning", sub: "24-hour deadline", hours: 24 });
    cs.push({ label: "NIS2 Art.23 — formal notification", sub: "72-hour deadline", hours: 72 });
  }
  if (isFinancial(s.sector)) {
    cs.push({ label: "DORA Art.19 — initial report", sub: "4-hour deadline", hours: 4 });
  }
  return cs;
};

const ClockDisplay = ({ clock, discovery }: { clock: Clock; discovery: string }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!discovery) {
    return (
      <div className="aegis-clock-card">
        <div className="aegis-clock-label">{clock.label}</div>
        <div className="aegis-clock-digit" style={{ color: "#a8bbd4" }}>--:--:--</div>
        <div className="aegis-clock-sub">{clock.sub}</div>
      </div>
    );
  }

  const start = new Date(discovery).getTime();
  const deadline = start + clock.hours * 3600 * 1000;
  const remainingMs = deadline - Date.now();

  let color = "#52d68a";
  let display: string;

  if (remainingMs <= 0) {
    display = "EXPIRED";
    color = "#ff6b6b";
  } else {
    const totalSec = Math.floor(remainingMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const sec = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    display = `${pad(h)}:${pad(m)}:${pad(sec)}`;
    const hrsLeft = remainingMs / 3600000;
    if (hrsLeft < 6) color = "#ff6b6b";
    else if (hrsLeft < 24) color = "#ffc46b";
  }

  return (
    <div className="aegis-clock-card">
      <div className="aegis-clock-label">{clock.label}</div>
      <div className="aegis-clock-digit" style={{ color }}>{display}</div>
      <div className="aegis-clock-sub">{clock.sub}</div>
    </div>
  );
};

const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="aegis-btn-secondary"
      style={{ fontSize: 11, padding: "4px 10px", position: "absolute", top: 12, right: 12 }}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

const SourcedCard = ({ heading, result }: { heading: string; result: LDAResult }) => (
  <div className="aegis-card mb-4" style={{ position: "relative" }}>
    <span className="aegis-sourced-badge" style={{ position: "absolute", top: 14, right: 14 }}>SOURCED</span>
    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 10, paddingRight: 70 }}>{heading}</div>
    <div style={{ color: "#a8bbd4", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
      {result.answer || "(no answer returned)"}
    </div>
    {result.sources.length > 0 && (
      <details style={{ marginTop: 12 }}>
        <summary style={{ color: "#63aff0", fontSize: 11, cursor: "pointer" }}>
          View sources ({result.sources.length})
        </summary>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {result.sources.map((src: LDASource, i) => (
            <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              <span style={{ color: "#63aff0" }}>[{src.source_indicator ?? i + 1}]</span>{" "}
              {src.source ?? "Source"}{" "}
              {src.oso_url && (
                <a href={src.oso_url} target="_blank" rel="noopener noreferrer" style={{ color: "#63aff0", textDecoration: "underline" }}>
                  open ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </details>
    )}
  </div>
);

// --- Risk matrix calculation ---
const computeMatrix = (s: FormState) => {
  const danger = hasAnyDanger(s.dataCategories);
  const highVol = s.numAffected === "5k-50k" || s.numAffected === "o50k";
  let frameworks = 0;
  if (hasAnyPersonalData(s.dataCategories)) frameworks++;
  if (isNIS2Sector(s.sector)) frameworks++;
  if (isFinancial(s.sector)) frameworks++;

  const x = frameworks >= 3 ? 2 : frameworks === 2 ? 1 : 0; // 0 low, 2 high
  const y = danger && highVol ? 2 : (danger || highVol) ? 1 : 0;

  const xLabel = ["Low", "Medium", "High"][x];
  const yLabel = ["Low", "Medium", "High"][y];

  let level: "low" | "med" | "high" = "low";
  let color = "#52d68a";
  if (x === 2 && y === 2) { level = "high"; color = "#ff6b6b"; }
  else if (x + y >= 3) { level = "high"; color = "#ff6b6b"; }
  else if (x + y >= 2) { level = "med"; color = "#ffc46b"; }
  else if (x + y >= 1) { level = "med"; color = "#ffc46b"; }

  const sentence = `This incident plots at ${xLabel.toLowerCase()} regulatory complexity and ${yLabel.toLowerCase()} impact severity — ${
    level === "high" ? "treat as priority and escalate immediately to senior leadership and outside counsel."
    : level === "med" ? "manage actively with DPO and Legal oversight; escalate if facts worsen."
    : "monitor and document; standard response process applies."
  }`;

  return { x, y, color, xLabel, yLabel, sentence };
};

const RiskMatrix = ({ s }: { s: FormState }) => {
  const m = useMemo(() => computeMatrix(s), [s]);
  const cell = 64;
  const padding = 36;
  const w = padding + cell * 3 + 12;
  const h = padding + cell * 3 + 24;
  const cx = padding + cell * m.x + cell / 2;
  const cy = padding + cell * (2 - m.y) + cell / 2;

  return (
    <div>
      <svg width={w} height={h} style={{ display: "block" }}>
        {/* grid */}
        {[0,1,2].map(r => [0,1,2].map(c => (
          <rect
            key={`${r}-${c}`}
            x={padding + c * cell}
            y={padding + r * cell}
            width={cell}
            height={cell}
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.08)"
          />
        )))}
        {/* axis labels */}
        <text x={padding} y={padding + cell * 3 + 16} fill="#a8bbd4" fontSize={10}>Complexity →</text>
        <text x={6} y={padding + 4} fill="#a8bbd4" fontSize={10} transform={`rotate(-90 6 ${padding + 4})`}>Impact →</text>
        {/* dot */}
        <circle cx={cx} cy={cy} r={11} fill={m.color} stroke="#0d1b2e" strokeWidth={3} />
      </svg>
      <div style={{ color: "#a8bbd4", fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>{m.sentence}</div>
    </div>
  );
};

// --- Tech actions checklist with local state + inline legal-basis chip ---
const TechChecklist = ({ items }: { items: RecommendedAction[] }) => {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  useEffect(() => { setChecked(items.map(() => false)); }, [items]);

  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 4,
          }}
        >
          <span
            onClick={() => setChecked(c => c.map((v, idx) => idx === i ? !v : v))}
            style={{
              width: 16, height: 16, borderRadius: 3, marginTop: 2, flexShrink: 0, cursor: "pointer",
              border: `1.5px solid ${checked[i] ? "#52d68a" : "#63aff0"}`,
              background: checked[i] ? "#52d68a" : "transparent",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#0d1b2e", fontSize: 11, fontWeight: 700,
            }}
          >{checked[i] ? "✓" : ""}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: checked[i] ? "#64748B" : "#a8bbd4",
              fontSize: 13, lineHeight: 1.5,
              textDecoration: checked[i] ? "line-through" : "none",
            }}>{item.action}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                background: "rgba(82,214,138,0.12)",
                border: "1px solid rgba(82,214,138,0.4)",
                color: "#52D68A",
                padding: "2px 7px", borderRadius: 3,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}>{item.legal_basis}</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.4 }}>
                {item.rationale}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

// --- Coordination banner ---
const CoordinationBanner = () => (
  <div style={{
    background: "#112240",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 4,
    padding: "14px 18px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 28,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{
        width: 28, height: 28, borderRadius: "50%", background: "#1A56DB",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      }}>LR</span>
      <span style={{ color: "#fff", fontSize: 13 }}>Legal Reasoning is coordinating both tracks simultaneously</span>
    </div>
    <svg width={260} height={44} style={{ flexShrink: 0 }}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#63aff0" />
        </marker>
      </defs>
      {/* nodes */}
      <circle cx={26} cy={22} r={16} fill="rgba(99,175,240,0.12)" stroke="#63aff0" />
      <text x={26} y={26} fill="#63aff0" fontSize={9} textAnchor="middle">Intake</text>
      <circle cx={130} cy={22} r={16} fill="rgba(26,86,219,0.25)" stroke="#1A56DB" />
      <text x={130} y={26} fill="#fff" fontSize={9} textAnchor="middle">LR</text>
      <circle cx={234} cy={22} r={16} fill="rgba(82,214,138,0.12)" stroke="#52D68A" />
      <text x={234} y={20} fill="#52D68A" fontSize={8} textAnchor="middle">Tech +</text>
      <text x={234} y={30} fill="#52D68A" fontSize={8} textAnchor="middle">Legal</text>
      {/* arrows */}
      <line x1={44} y1={22} x2={112} y2={22} stroke="#63aff0" strokeWidth={1.5} markerEnd="url(#arr)" />
      <line x1={148} y1={22} x2={216} y2={22} stroke="#63aff0" strokeWidth={1.5} markerEnd="url(#arr)" />
    </svg>
  </div>
);

const ColumnHeader = ({ kicker, kickerColor, sub }: { kicker: string; kickerColor: string; sub: string }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ color: kickerColor, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}>{kicker}</div>
    <div style={{ color: "#a8bbd4", fontSize: 11, marginTop: 4 }}>{sub}</div>
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="aegis-section-label" style={{ marginBottom: 10, marginTop: 24 }}>{children}</div>
);

export const Screen4 = ({
  state, ldaGdpr, ldaNis2, ldaDora, ldaConnected, ai, aiError, auditLog,
  onBack, onRestart,
}: Props) => {
  const verdict = computeVerdict(state);
  const clocks = buildClocks(state);
  const dpaName = state.jurisdiction ? DPA_MAP[state.jurisdiction] : "your lead supervisory authority";

  const legalLoading = !ai && !aiError;

  return (
    <div className="mx-auto" style={{ maxWidth: 1280, padding: 32 }}>
      <div className="aegis-section-label mb-2">Step 4 of 4</div>
      <h2 className="aegis-title mb-3">Assessment &amp; Action Plan</h2>
      <p className="aegis-helper mb-6">
        Two parallel response tracks. Tech team can act immediately; legal track loads as Legal Reasoning completes drafting.
      </p>

      <CoordinationBanner />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
          gap: 24,
        }}
        className="aegis-two-track"
      >
        {/* LEFT — TECH TRACK */}
        <div>
          <ColumnHeader kicker="TECH TRACK" kickerColor="#63AFF0" sub="Actions for your InfoSec and IT team" />

          {/* Verdict */}
          <div className="aegis-card" style={verdictStyle(verdict.level)}>
            <div style={{ fontSize: 18, fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", marginBottom: 8 }}>
              {verdict.label}
            </div>
            <div style={{ color: "#a8bbd4", fontSize: 13, lineHeight: 1.7 }}>{verdict.basis}</div>
          </div>

          {/* Prioritized action plan — ordered by urgency, audit-ready */}
          <SectionLabel>Prioritized action plan (urgency order)</SectionLabel>
          {(() => {
            const discoveredMs = state.discoveryTime ? new Date(state.discoveryTime).getTime() : Date.now();
            const plan = buildPrioritizedPlan(state, ai, discoveredMs, []);
            if (plan.length === 0) {
              return <div className="aegis-card aegis-helper">Action plan will appear once the assessment completes.</div>;
            }
            return (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: 14 }}>
                <PrioritizedActionPlan actions={plan} showHeader={false} />
                <div style={{ marginTop: 10, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                  Mark-done and oversight actions are recorded in the incident audit log on the dashboard.
                  Open this incident from the dashboard to persist completions.
                </div>
              </div>
            );
          })()}

          {/* Clocks */}
          <SectionLabel>Active regulatory clocks</SectionLabel>
          {clocks.length === 0 ? (
            <div className="aegis-card aegis-helper">No clocks active for the selected inputs.</div>
          ) : (
            <>
              <div className="grid gap-3" style={{ gridTemplateColumns: "1fr" }}>
                {clocks.map((c, i) => <ClockDisplay key={i} clock={c} discovery={state.discoveryTime} />)}
              </div>
              {!state.discoveryTime && (
                <div className="aegis-helper" style={{ marginTop: 8, fontSize: 12 }}>
                  Enter discovery time in Step 1 to start clocks.
                </div>
              )}
            </>
          )}

          {/* Immediate technical actions */}
          <SectionLabel>Immediate technical actions</SectionLabel>
          {legalLoading ? (
            <div className="aegis-card aegis-helper">Awaiting Legal Reasoning checklist…</div>
          ) : aiError || !ai ? (
            <div className="aegis-card aegis-helper">No checklist available — Legal Reasoning assessment failed.</div>
          ) : (
            <TechChecklist items={(ai.recommended_actions ?? []).map(normalizeAction)} />
          )}

          {/* Audit log */}
          <SectionLabel>Incident audit log</SectionLabel>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              padding: 16,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              color: "#a8bbd4",
              lineHeight: 1.7,
              maxHeight: 320,
              overflowY: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {auditLog.join("\n")}
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} className="aegis-track-divider" />

        {/* RIGHT — LEGAL TRACK */}
        <div>
          <ColumnHeader kicker="LEGAL TRACK" kickerColor="#52D68A" sub="Submitted to lawyers — Legal Reasoning assisted" />

          {legalLoading ? (
            <div className="aegis-card" style={{ textAlign: "center", padding: 48 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  border: "3px solid rgba(255,255,255,0.1)",
                  borderTopColor: "#52D68A",
                  margin: "0 auto 16px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ color: "#a8bbd4", fontSize: 13 }}>Legal Reasoning is preparing legal track…</div>
            </div>
          ) : aiError || !ai ? (
            <div className="aegis-card" style={{ borderLeft: "3px solid #ff6b6b" }}>
              <div style={{ color: "#ff6b6b", fontWeight: 600, marginBottom: 6 }}>Legal track could not be generated</div>
              <div style={{ color: "#a8bbd4", fontSize: 13 }}>
                The Legal Reasoning service is temporarily unavailable. Please try again shortly.
              </div>
            </div>
          ) : (
            <>
              {/* Legal Reasoning risk assessment */}
              <SectionLabel>Legal Reasoning risk assessment</SectionLabel>
              <div className="aegis-card" style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(13,59,34,0.4)",
                  border: "1px solid #52D68A",
                  color: "#52D68A",
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 3,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>Submitted to lawyers</span>
                <div style={{ color: "#a8bbd4", fontSize: 13, lineHeight: 1.7, paddingRight: 140 }}>
                  {ai.risk_assessment}
                </div>
                {ai.key_gaps?.length > 0 && (
                  <>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginTop: 14, marginBottom: 6 }}>
                      Information gaps that would change this assessment:
                    </div>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                      {ai.key_gaps.map((g, i) => (
                        <li key={i} style={{ color: "#ffc46b", fontSize: 12, lineHeight: 1.7 }}>{g}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* LDA Law layer */}
              {ldaConnected && (ldaGdpr || ldaNis2 || ldaDora) && (
                <>
                  <SectionLabel>Law layer</SectionLabel>
                  {ldaGdpr && <SourcedCard heading="GDPR Art.33 / 34 — sourced legal guidance" result={ldaGdpr} />}
                  {ldaNis2 && <SourcedCard heading="NIS2 Art.23 — sourced legal guidance" result={ldaNis2} />}
                  {ldaDora && <SourcedCard heading="DORA Art.19 — sourced legal guidance" result={ldaDora} />}
                </>
              )}

              {/* Tech-actions → legal-basis mirror table (audit) */}
              <SectionLabel>Tech actions → legal basis (audit mirror)</SectionLabel>
              <div className="aegis-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr",
                  background: "rgba(82,214,138,0.08)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  padding: "10px 14px",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#52D68A",
                  fontWeight: 600,
                }}>
                  <div>Tech action</div>
                  <div>Statutory anchor</div>
                </div>
                {(ai.recommended_actions ?? []).map(normalizeAction).map((a, i) => (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr",
                    padding: "10px 14px",
                    borderBottom: i < (ai.recommended_actions?.length ?? 0) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}>
                    <div style={{ color: "#a8bbd4", paddingRight: 12 }}>{a.action}</div>
                    <div>
                      <div style={{
                        display: "inline-block",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 11,
                        color: "#52D68A",
                        background: "rgba(82,214,138,0.10)",
                        border: "1px solid rgba(82,214,138,0.35)",
                        padding: "2px 7px",
                        borderRadius: 3,
                        marginBottom: 4,
                      }}>{a.legal_basis}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{a.rationale}</div>
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.02)",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.5,
                }}>
                  Audit-log retention basis (org-stated):{" "}
                  <span style={{ color: "#a8bbd4" }}>
                    {state.retentionBasis || "GDPR Art.6(1)(c) + Art.33(5) + Art.32 (default)"}
                  </span>
                </div>
              </div>

              {/* Lawyer packet (structured) */}
              {ai.lawyer_packet && (
                <>
                  <SectionLabel>Lawyer packet (structured)</SectionLabel>
                  <div className="aegis-card">
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Incident summary</div>
                    <div style={{ color: "#a8bbd4", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                      {ai.lawyer_packet.incident_summary}
                    </div>

                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Frameworks triggered</div>
                    <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ai.lawyer_packet.frameworks_triggered.map((f, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: "3px 8px", borderRadius: 3,
                          background: "rgba(99,175,240,0.12)", color: "#63AFF0",
                          border: "1px solid rgba(99,175,240,0.4)",
                        }}>{f}</span>
                      ))}
                    </div>

                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Active deadlines</div>
                    <ul style={{ paddingLeft: 18, margin: "0 0 14px 0" }}>
                      {ai.lawyer_packet.active_deadlines.map((d, i) => (
                        <li key={i} style={{ color: "#a8bbd4", fontSize: 12, lineHeight: 1.7 }}>
                          <strong style={{ color: "#fff" }}>{d.framework}</strong> — {d.deadline}{" "}
                          <span style={{ color: "#ffc46b" }}>({d.status})</span>
                        </li>
                      ))}
                    </ul>

                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Decisions needed from counsel</div>
                    <ul style={{ paddingLeft: 18, margin: "0 0 14px 0" }}>
                      {ai.lawyer_packet.decisions_needed.map((d, i) => (
                        <li key={i} style={{ color: "#a8bbd4", fontSize: 12, lineHeight: 1.7 }}>{d}</li>
                      ))}
                    </ul>

                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Privilege posture</div>
                    <div style={{ color: "#a8bbd4", fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
                      {ai.lawyer_packet.privilege_note}
                    </div>

                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Open questions</div>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                      {ai.lawyer_packet.open_questions.map((q, i) => (
                        <li key={i} style={{ color: "#ffc46b", fontSize: 12, lineHeight: 1.7 }}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Risk matrix */}
              <SectionLabel>Risk matrix</SectionLabel>
              <div className="aegis-card">
                <RiskMatrix s={state} />
              </div>

              {/* Draft notifications */}
              <SectionLabel>Draft notifications</SectionLabel>

              <div className="aegis-card mb-4" style={{ position: "relative" }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 4, paddingRight: 70 }}>
                  Draft A — Supervisory authority — GDPR Art.33
                </div>
                <div style={{ color: "#a8bbd4", fontSize: 11, marginBottom: 10 }}>
                  Addressed to: {dpaName}
                </div>
                <CopyBtn text={ai.notification_draft} />
                <div className="aegis-draft">{ai.notification_draft}</div>
              </div>

              <div className="aegis-card mb-4" style={{ position: "relative" }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 10, paddingRight: 70 }}>
                  Draft B — Internal escalation — CISO / CEO
                </div>
                <CopyBtn text={ai.internal_alert} />
                <div className="aegis-draft">{ai.internal_alert}</div>
              </div>

              <div className="aegis-card mb-4" style={{ position: "relative" }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 10, paddingRight: 70 }}>
                  Draft C — Lawyer handoff summary
                </div>
                <CopyBtn text={ai.lawyer_handoff ?? ""} />
                <div className="aegis-draft">{ai.lawyer_handoff ?? "(not generated)"}</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row mt-10">
        <button className="aegis-btn-secondary" onClick={onBack}>← Back to legal context</button>
        <button className="aegis-btn-primary" onClick={onRestart}>Start a new incident</button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .aegis-two-track { grid-template-columns: 1fr !important; }
          .aegis-track-divider { display: none; }
        }
      `}</style>
    </div>
  );
};
