import {
  FormState,
  hasAnyDanger,
  hasAnyPersonalData,
  isNIS2Sector,
  isFinancial,
} from "@/lib/aegis";
import type { Clock } from "./ClockDisplay";

export type VerdictLevel = "likely" | "possibly" | "unlikely";

export interface Verdict {
  level: VerdictLevel;
  label: string;
  basis: string;
}

export const computeVerdict = (s: FormState): Verdict => {
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
      basis:
        "Personal data is involved but no clear high-risk indicators have been triggered. Conduct a documented Art.33 risk assessment; if the breach is unlikely to result in risk to the rights and freedoms of natural persons, notification may not be required — but document the rationale.",
    };
  }
  return {
    level: "unlikely",
    label: "Notification unlikely required",
    basis:
      "Based on the inputs provided, no personal data appears to be involved. NIS2 / DORA / sectoral obligations may still apply — review framework section below.",
  };
};

export const verdictClass = (level: VerdictLevel): string => {
  if (level === "likely") return "border-l-4 border-l-red-400 bg-red-900/20";
  if (level === "possibly") return "border-l-4 border-l-amber-400 bg-amber-900/20";
  return "border-l-4 border-l-emerald-400 bg-emerald-900/20";
};

export const buildClocks = (s: FormState): Clock[] => {
  const cs: Clock[] = [];
  if (hasAnyPersonalData(s.dataCategories)) {
    cs.push({
      label: "GDPR Art.33 — supervisory authority",
      sub: "72-hour deadline",
      hours: 72,
    });
  }
  if (isNIS2Sector(s.sector)) {
    cs.push({ label: "NIS2 Art.23 — early warning", sub: "24-hour deadline", hours: 24 });
    cs.push({
      label: "NIS2 Art.23 — formal notification",
      sub: "72-hour deadline",
      hours: 72,
    });
  }
  if (isFinancial(s.sector)) {
    cs.push({ label: "DORA Art.19 — initial report", sub: "4-hour deadline", hours: 4 });
  }
  return cs;
};
