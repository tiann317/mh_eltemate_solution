// Persistent "not legal advice" disclaimer. WCAG: 4.5:1+ contrast, role=note,
// keyboard reachable. Reused on intake, dashboard, incident detail, and PDF export.
export const LegalDisclaimer = ({ compact = false }: { compact?: boolean }) => (
  <div
    role="note"
    aria-label="Legal disclaimer"
    style={{
      background: "#fffbeb",          // amber-50
      border: "1px solid #b45309",    // amber-700 — 5.0:1 on white
      color: "#78350f",               // amber-900 — 9.7:1 on white
      borderLeft: "4px solid #b45309",
      padding: compact ? "8px 12px" : "12px 16px",
      borderRadius: 4,
      fontSize: compact ? 12 : 13,
      lineHeight: 1.55,
    }}
  >
    <strong style={{ color: "#78350f", fontWeight: 700 }}>
      Not legal advice.
    </strong>{" "}
    Aegis Notice surfaces best-practice guidance for similar incidents based on
    publicly available regulatory text. It does <em>not</em> create a
    lawyer–client relationship and is <em>not</em> a legally binding opinion.
    Always have a qualified lawyer or DPO review before relying on any output.
  </div>
);

export default LegalDisclaimer;
