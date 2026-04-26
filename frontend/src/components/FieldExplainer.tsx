import { useState } from "react";

interface Props {
  term: string;        // e.g. "Personal data"
  plain: string;       // 1-3 sentence layperson definition
  examples?: string;   // optional concrete examples
  cite?: string;       // optional statutory pin
}

/**
 * Inline "what does this mean?" disclosure used inside form fields so a tech
 * responder doesn't need a lawyer to fill the form. Keeps the page calm by
 * default and expands on click.
 */
export const FieldExplainer = ({ term, plain, examples, cite }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 6 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: "#63AFF0",
          fontSize: 11,
          letterSpacing: "0.05em",
          cursor: "pointer",
          textDecoration: "underline dotted",
          textUnderlineOffset: 3,
        }}
      >
        {open ? "▾" : "▸"} What is &ldquo;{term}&rdquo;?
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            padding: "10px 12px",
            background: "rgba(99,175,240,0.06)",
            border: "1px solid rgba(99,175,240,0.25)",
            color: "#cbd5e1",
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          <div>{plain}</div>
          {examples && (
            <div style={{ marginTop: 6, color: "#94a3b8" }}>
              <strong style={{ color: "#cbd5e1" }}>Examples:</strong> {examples}
            </div>
          )}
          {cite && (
            <div style={{ marginTop: 6, color: "#63AFF0", fontSize: 10.5, letterSpacing: "0.05em" }}>
              {cite}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
