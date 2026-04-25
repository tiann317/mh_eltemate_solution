import type { StepErrors } from "@/lib/validation";

interface Props {
  errors?: StepErrors;
}

// Shows a top-of-screen summary of validation errors collected from the
// last "Next" / "Generate" attempt. Hidden when there are no errors.
export const ValidationBanner = ({ errors }: Props) => {
  if (!errors) return null;
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <div
      role="alert"
      style={{
        marginBottom: 20,
        padding: "12px 14px",
        border: "1px solid rgba(239,68,68,0.5)",
        background: "rgba(239,68,68,0.08)",
        color: "#fecaca",
      }}
    >
      <div style={{ color: "#ef4444", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
        ⚠ Please fix {entries.length} field{entries.length === 1 ? "" : "s"} to continue
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.7 }}>
        {entries.map(([k, msg]) => (
          <li key={k}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};
