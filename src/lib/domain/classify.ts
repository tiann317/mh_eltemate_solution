import type { DataCategory, FormState, Sector } from "./types";

export const DANGER_CATEGORIES: DataCategory[] = [
  "location", "health", "biometric", "children", "criminal", "special-other",
];

export const NIS2_SECTORS: Sector[] = [
  "automotive", "energy", "lifesciences", "telecom", "transport", "digital",
];

export const isNIS2Sector = (s: Sector) => NIS2_SECTORS.includes(s);
export const isFinancial = (s: Sector) => s === "financial";
export const isCERSector = (s: Sector) => s === "energy" || s === "transport";

export const hasAnyDanger = (cats: DataCategory[]) =>
  cats.some(c => DANGER_CATEGORIES.includes(c));

export const hasAnyPersonalData = (cats: DataCategory[]) =>
  cats.length > 0 && !(cats.length === 1 && cats[0] === "unknown");

export const fmtTimestamp = (d: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const computeRiskRating = (s: FormState): "low" | "medium" | "high" | "critical" => {
  const danger = hasAnyDanger(s.dataCategories);
  const highVol = s.numAffected === "5k-50k" || s.numAffected === "o50k";
  const physical = s.harmTypes.includes("physical");
  if (physical || (danger && highVol)) return "critical";
  if (danger || highVol) return "high";
  if (hasAnyPersonalData(s.dataCategories)) return "medium";
  return "low";
};
