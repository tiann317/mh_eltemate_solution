import type { FormState } from "./types";
import {
  hasAnyDanger, hasAnyPersonalData, isCERSector, isFinancial, isNIS2Sector,
} from "./classify";

export interface RegDeadline {
  framework: string;
  label: string;
  hours: number;
  applies: boolean;
}

export const getDeadlines = (s: FormState): RegDeadline[] => {
  const out: RegDeadline[] = [];
  out.push({
    framework: "GDPR Art.33",
    label: "DPA notification (72h)",
    hours: 72,
    applies: hasAnyPersonalData(s.dataCategories),
  });
  if (hasAnyDanger(s.dataCategories) || s.numAffected === "5k-50k" || s.numAffected === "o50k") {
    out.push({ framework: "GDPR Art.34", label: "Individual notification (without undue delay)", hours: 72, applies: true });
  }
  if (isNIS2Sector(s.sector)) {
    out.push({ framework: "NIS2 Art.23", label: "Early warning (24h)", hours: 24, applies: true });
    out.push({ framework: "NIS2 Art.23", label: "Incident notification (72h)", hours: 72, applies: true });
  }
  if (isFinancial(s.sector)) {
    out.push({ framework: "DORA Art.19", label: "Initial report (4h after classification)", hours: 4, applies: true });
  }
  if (isCERSector(s.sector) && s.cerOperator) {
    out.push({ framework: "CER Art.15", label: "Incident notification (24h)", hours: 24, applies: true });
  }
  return out;
};
