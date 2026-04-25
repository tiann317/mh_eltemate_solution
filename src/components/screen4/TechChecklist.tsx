import { useEffect, useState } from "react";
import type { RecommendedAction } from "@/lib/aegis";

interface Props {
  items: RecommendedAction[];
}

export const TechChecklist = ({ items }: Props) => {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  useEffect(() => {
    setChecked(items.map(() => false));
  }, [items]);

  const toggle = (i: number) =>
    setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)));

  return (
    <ol className="list-none p-0 m-0 flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-2.5 px-3 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-sm"
        >
          <span
            onClick={() => toggle(i)}
            className={`w-4 h-4 rounded-sm mt-0.5 flex-shrink-0 cursor-pointer border-[1.5px] inline-flex items-center justify-center text-[11px] font-bold ${
              checked[i]
                ? "bg-emerald-400 border-emerald-400 text-[#0d1b2e]"
                : "border-sky-400 bg-transparent"
            }`}
          >
            {checked[i] ? "✓" : ""}
          </span>
          <div className="flex-1 min-w-0">
            <div
              className={`text-[13px] leading-normal ${
                checked[i] ? "text-slate-500 line-through" : "text-muted-foreground"
              }`}
            >
              {item.action}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] font-semibold tracking-wider bg-emerald-400/[0.12] border border-emerald-400/40 text-emerald-400 px-1.5 py-0.5 rounded-sm font-mono">
                {item.legal_basis}
              </span>
              <span className="text-white/50 text-[11px] leading-tight">
                {item.rationale}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};
