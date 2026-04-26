// Visual escalation diagram showing where the incident currently sits on
// both the technical track and the legal track. WCAG 2.1 AA: every state
// has a label and an icon (not colour-only), 4.5:1+ text contrast.

const TECH_STATES = [
  { key: "not_started", label: "Not started" },
  { key: "triaging", label: "Triaging" },
  { key: "contained", label: "Contained" },
  { key: "recovered", label: "Recovered" },
  { key: "closed", label: "Closed" },
];
const LEGAL_STATES = [
  { key: "not_started", label: "Not started" },
  { key: "lawyer_review", label: "Lawyer review" },
  { key: "authority_notified", label: "Authority notified" },
  { key: "closed", label: "Closed" },
];

function Track({
  title, states, current, onChange,
}: {
  title: string;
  states: { key: string; label: string }[];
  current: string;
  onChange: (k: string) => void;
}) {
  const idx = Math.max(0, states.findIndex(s => s.key === current));
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569", marginBottom: 8, fontWeight: 600 }}>
        {title}
      </div>
      <ol
        aria-label={`${title} escalation steps`}
        style={{ display: "flex", gap: 6, listStyle: "none", padding: 0, margin: 0, flexWrap: "wrap" }}
      >
        {states.map((s, i) => {
          const reached = i <= idx;
          const isCurrent = i === idx;
          return (
            <li key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => onChange(s.key)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${title} — ${s.label}${isCurrent ? " (current)" : reached ? " (completed)" : " (upcoming)"}`}
                style={{
                  background: isCurrent ? "#1a56db" : reached ? "#dbeafe" : "#ffffff",
                  color: isCurrent ? "#ffffff" : reached ? "#1e3a8a" : "#475569",
                  border: `1px solid ${reached ? "#1a56db" : "#94a3b8"}`,
                  borderRadius: 4,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                <span aria-hidden="true">{reached ? "●" : "○"}</span>{" "}
                {s.label}
              </button>
              {i < states.length - 1 && (
                <span aria-hidden="true" style={{ color: "#94a3b8" }}>→</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export const EscalationDiagram = ({
  techState, legalState, onTechChange, onLegalChange,
}: {
  techState: string; legalState: string;
  onTechChange: (k: string) => void;
  onLegalChange: (k: string) => void;
}) => (
  <div
    role="group"
    aria-label="Escalation status"
    style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 4, padding: 16 }}
  >
    <Track title="Technical track" states={TECH_STATES} current={techState} onChange={onTechChange} />
    <Track title="Legal track" states={LEGAL_STATES} current={legalState} onChange={onLegalChange} />
    <p style={{ marginTop: 8, color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
      Click a step to update where the incident currently sits. Both tracks are recorded for audit.
    </p>
  </div>
);

export default EscalationDiagram;
