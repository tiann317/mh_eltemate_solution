import { useMemo } from "react";
import {
  FormState,
  hasAnyDanger,
  hasAnyPersonalData,
  isNIS2Sector,
  isFinancial,
} from "@/lib/aegis";

interface MatrixResult {
  x: number;
  y: number;
  color: string;
  xLabel: string;
  yLabel: string;
  sentence: string;
}

export const computeMatrix = (s: FormState): MatrixResult => {
  const danger = hasAnyDanger(s.dataCategories);
  const highVol = s.numAffected === "5k-50k" || s.numAffected === "o50k";
  let frameworks = 0;
  if (hasAnyPersonalData(s.dataCategories)) frameworks++;
  if (isNIS2Sector(s.sector)) frameworks++;
  if (isFinancial(s.sector)) frameworks++;

  const x = frameworks >= 3 ? 2 : frameworks === 2 ? 1 : 0;
  const y = danger && highVol ? 2 : danger || highVol ? 1 : 0;

  const labels = ["Low", "Medium", "High"];
  const xLabel = labels[x];
  const yLabel = labels[y];

  let level: "low" | "med" | "high" = "low";
  let color = "#52d68a";
  if ((x === 2 && y === 2) || x + y >= 3) {
    level = "high";
    color = "#ff6b6b";
  } else if (x + y >= 1) {
    level = "med";
    color = "#ffc46b";
  }

  const action =
    level === "high"
      ? "treat as priority and escalate immediately to senior leadership and outside counsel."
      : level === "med"
      ? "manage actively with DPO and Legal oversight; escalate if facts worsen."
      : "monitor and document; standard response process applies.";

  const sentence = `This incident plots at ${xLabel.toLowerCase()} regulatory complexity and ${yLabel.toLowerCase()} impact severity — ${action}`;

  return { x, y, color, xLabel, yLabel, sentence };
};

export const RiskMatrix = ({ s }: { s: FormState }) => {
  const m = useMemo(() => computeMatrix(s), [s]);
  const cell = 64;
  const padding = 36;
  const w = padding + cell * 3 + 12;
  const h = padding + cell * 3 + 24;
  const cx = padding + cell * m.x + cell / 2;
  const cy = padding + cell * (2 - m.y) + cell / 2;

  return (
    <div>
      <svg width={w} height={h} className="block">
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={padding + c * cell}
              y={padding + r * cell}
              width={cell}
              height={cell}
              fill="rgba(255,255,255,0.02)"
              stroke="rgba(255,255,255,0.08)"
            />
          ))
        )}
        <text x={padding} y={padding + cell * 3 + 16} fill="#a8bbd4" fontSize={10}>
          Complexity →
        </text>
        <text
          x={6}
          y={padding + 4}
          fill="#a8bbd4"
          fontSize={10}
          transform={`rotate(-90 6 ${padding + 4})`}
        >
          Impact →
        </text>
        <circle cx={cx} cy={cy} r={11} fill={m.color} stroke="#0d1b2e" strokeWidth={3} />
      </svg>
      <div className="text-muted-foreground text-xs leading-6 mt-2.5">{m.sentence}</div>
    </div>
  );
};
