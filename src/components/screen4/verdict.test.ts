import { describe, it, expect } from "vitest";
import { computeVerdict, buildClocks } from "./verdict";
import type { FormState } from "@/lib/aegis";

const empty: FormState = {
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

describe("computeVerdict", () => {
  it("returns unlikely with no personal data", () => {
    expect(computeVerdict(empty).level).toBe("unlikely");
  });

  it("returns possibly when personal data present without dangers", () => {
    expect(
      computeVerdict({ ...empty, dataCategories: ["contact"] } as FormState).level,
    ).toBe("possibly");
  });

  it("returns likely on ransomware", () => {
    expect(
      computeVerdict({ ...empty, incidentType: "ransomware" } as FormState).level,
    ).toBe("likely");
  });

  it("returns likely on special category data", () => {
    expect(
      computeVerdict({ ...empty, dataCategories: ["health"] } as FormState).level,
    ).toBe("likely");
  });
});

describe("buildClocks", () => {
  it("emits no clocks for an empty form", () => {
    expect(buildClocks(empty)).toHaveLength(0);
  });

  it("emits GDPR clock when personal data present", () => {
    const clocks = buildClocks({
      ...empty,
      dataCategories: ["contact"],
    } as FormState);
    expect(clocks.some((c) => c.label.includes("GDPR"))).toBe(true);
  });

  it("emits DORA 4-hour clock for financial sector", () => {
    const clocks = buildClocks({ ...empty, sector: "finance" } as FormState);
    expect(clocks.some((c) => c.hours === 4)).toBe(true);
  });
});
