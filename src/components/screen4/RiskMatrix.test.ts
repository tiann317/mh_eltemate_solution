import { describe, it, expect } from "vitest";
import { computeMatrix } from "./RiskMatrix";
import type { FormState } from "@/lib/aegis";

const baseState: FormState = {
  discoveryTime: "",
  incidentType: "",
  systemsAffected: "",
  ongoingStatus: "",
  backupsAvailable: "",
  deviceEncrypted: "",
  exfiltrationConfirmed: "",
  dataCategories: [],
  numAffected: "",
  jurisdiction: "",
  sector: "",
  harmTypes: [],
  vulnerableGroups: [],
  retentionBasis: "",
} as unknown as FormState;

describe("computeMatrix", () => {
  it("returns low/low for empty form", () => {
    const m = computeMatrix(baseState);
    expect(m.x).toBe(0);
    expect(m.y).toBe(0);
    expect(m.xLabel).toBe("Low");
    expect(m.yLabel).toBe("Low");
  });

  it("escalates impact when special category + high volume", () => {
    const m = computeMatrix({
      ...baseState,
      dataCategories: ["health"],
      numAffected: "o50k",
    } as FormState);
    expect(m.y).toBe(2);
    expect(m.color).toBe("#ff6b6b");
  });

  it("flags medium when single risk indicator present", () => {
    const m = computeMatrix({
      ...baseState,
      dataCategories: ["health"],
    } as FormState);
    expect(m.y).toBe(1);
  });
});
