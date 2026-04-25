import { describe, expect, it } from "vitest";
import { initialState } from "@/lib/domain/types";
import {
  DANGER_CATEGORIES, NIS2_SECTORS,
  computeRiskRating, fmtTimestamp, hasAnyDanger, hasAnyPersonalData,
  isCERSector, isFinancial, isNIS2Sector,
} from "@/lib/domain/classify";

describe("domain/classify — sector predicates", () => {
  it("isNIS2Sector matches the documented NIS2 list", () => {
    for (const s of NIS2_SECTORS) expect(isNIS2Sector(s)).toBe(true);
    expect(isNIS2Sector("financial")).toBe(false);
    expect(isNIS2Sector("consumer")).toBe(false);
    expect(isNIS2Sector("")).toBe(false);
  });

  it("isFinancial only matches financial", () => {
    expect(isFinancial("financial")).toBe(true);
    expect(isFinancial("energy")).toBe(false);
    expect(isFinancial("")).toBe(false);
  });

  it("isCERSector matches energy and transport only", () => {
    expect(isCERSector("energy")).toBe(true);
    expect(isCERSector("transport")).toBe(true);
    expect(isCERSector("financial")).toBe(false);
    expect(isCERSector("digital")).toBe(false);
  });
});

describe("domain/classify — data category predicates", () => {
  it("hasAnyDanger detects every special-category flag", () => {
    for (const c of DANGER_CATEGORIES) expect(hasAnyDanger([c])).toBe(true);
    expect(hasAnyDanger(["basic-contact"])).toBe(false);
    expect(hasAnyDanger([])).toBe(false);
  });

  it("hasAnyPersonalData treats lone 'unknown' as no data", () => {
    expect(hasAnyPersonalData([])).toBe(false);
    expect(hasAnyPersonalData(["unknown"])).toBe(false);
    expect(hasAnyPersonalData(["unknown", "basic-contact"])).toBe(true);
    expect(hasAnyPersonalData(["financial"])).toBe(true);
  });
});

describe("computeRiskRating", () => {
  it("returns low when no personal data", () => {
    expect(computeRiskRating(initialState)).toBe("low");
    expect(computeRiskRating({ ...initialState, dataCategories: ["unknown"] })).toBe("low");
  });

  it("returns medium with non-special-category personal data", () => {
    expect(computeRiskRating({ ...initialState, dataCategories: ["basic-contact"] })).toBe("medium");
  });

  it("returns high with special category OR high volume", () => {
    expect(computeRiskRating({ ...initialState, dataCategories: ["health"] })).toBe("high");
    expect(computeRiskRating({ ...initialState, dataCategories: ["basic-contact"], numAffected: "o50k" })).toBe("high");
  });

  it("returns critical with special category AND high volume, or any physical harm", () => {
    expect(computeRiskRating({ ...initialState, dataCategories: ["children"], numAffected: "5k-50k" })).toBe("critical");
    expect(computeRiskRating({ ...initialState, harmTypes: ["physical"] })).toBe("critical");
  });
});

describe("fmtTimestamp", () => {
  it("formats a fixed date deterministically", () => {
    const d = new Date(2026, 3, 7, 9, 5, 4); // 7 Apr 2026 09:05:04 local
    expect(fmtTimestamp(d)).toBe("07 Apr 2026 09:05:04");
  });
});
