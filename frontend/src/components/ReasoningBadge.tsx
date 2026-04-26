interface Props {
  reason: string;     // why this conditional block appeared
  trigger?: string;   // e.g. the answer that triggered it
}

/**
 * Small "why am I seeing this?" chip rendered above conditional fields and
 * follow-up questions. Makes the form's logic transparent so users understand
 * the questions are being driven by their own answers.
 */
export const ReasoningBadge = ({ reason, trigger }: Props) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      padding: "8px 10px",
      marginBottom: 12,
      background: "rgba(82,214,138,0.06)",
      border: "1px solid rgba(82,214,138,0.25)",
      fontSize: 11.5,
      color: "#cbd5e1",
      lineHeight: 1.5,
    }}
    role="note"
  >
    <span style={{ color: "#52D68A", fontWeight: 700, flexShrink: 0 }}>↳ Follow-up</span>
    <span>
      {reason}
      {trigger && (
        <>
          {" "}
          <em style={{ color: "#94a3b8" }}>(triggered by: {trigger})</em>
        </>
      )}
    </span>
  </div>
);
