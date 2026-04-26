/**
 * DevJumpBar
 * ----------
 * A development-only navigation bar that lets engineers jump directly to any
 * intake step *without* auto-filling form data. Useful for testing Screen 3,
 * Screen 3.5, and Review without manually walking through the whole flow.
 *
 * Renders nothing in production builds (import.meta.env.PROD).
 */
interface Props {
  current: number;
  onJump: (step: number) => void;
  onFillSample?: () => void;
  onClear?: () => void;
}

const STEPS: { step: number; label: string }[] = [
  { step: 1, label: "1 · Discovery" },
  { step: 2, label: "2 · Data" },
  { step: 3, label: "3 · Org" },
  { step: 35, label: "3.5 · Legal" },
  { step: 38, label: "Review" },
  { step: 4, label: "Result" },
];

export const DevJumpBar = ({ current, onJump, onFillSample, onClear }: Props) => {
  if (import.meta.env.PROD) return null;
  return (
    <div
      data-testid="dev-jump-bar"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900"
    >
      <span className="mr-3 font-semibold uppercase tracking-wider">Dev jump</span>
      {STEPS.map(s => (
        <button
          key={s.step}
          type="button"
          onClick={() => onJump(s.step)}
          className={`mr-2 rounded border px-2 py-0.5 transition-colors ${
            current === s.step
              ? "border-amber-700 bg-amber-200 font-semibold"
              : "border-amber-300 bg-white hover:bg-amber-100"
          }`}
        >
          {s.label}
        </button>
      ))}
      {onFillSample && (
        <button
          type="button"
          onClick={onFillSample}
          className="ml-3 mr-2 rounded border border-emerald-600 bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900 hover:bg-emerald-200"
        >
          ⚡ Fill sample data
        </button>
      )}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mr-2 rounded border border-slate-400 bg-white px-2 py-0.5 text-slate-700 hover:bg-slate-100"
        >
          Clear
        </button>
      )}
      <span className="ml-2 text-amber-700">
        (sample data fills all 5 steps so you can jump straight to Review)
      </span>
    </div>
  );
};
