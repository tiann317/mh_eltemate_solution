import { describe, expect, it } from "vitest";
import { initialState } from "@/lib/domain/types";
import { validateAll, validateStep } from "@/lib/validation";

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

describe("validateStep — step 1", () => {
  it("rejects empty discovery time", () => {
    const r = validateStep(1, initialState);
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors)).toContain("discoveryTime");
  });

  it("accepts a valid step 1", () => {
    const r = validateStep(1, {
      ...initialState,
      discoveryTime: minutesAgo(10),
      incidentType: "ransomware",
      systemsAffected: "Production database",
      ongoingStatus: "partially",
      backupsAvailable: "yes",
    });
    expect(r.ok).toBe(true);
  });

  it("rejects future discovery time", () => {
    const future = new Date(Date.now() + 60 * 60_000).toISOString();
    const r = validateStep(1, {
      ...initialState,
      discoveryTime: future,
      incidentType: "other",
      systemsAffected: "x",
      ongoingStatus: "no",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.discoveryTime).toMatch(/future/i);
  });

  it("requires backups answer for ransomware", () => {
    const r = validateStep(1, {
      ...initialState,
      discoveryTime: minutesAgo(5),
      incidentType: "ransomware",
      systemsAffected: "x",
      ongoingStatus: "no",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.backupsAvailable).toBeDefined();
  });

  it("requires encryption answer for lost-device", () => {
    const r = validateStep(1, {
      ...initialState,
      discoveryTime: minutesAgo(5),
      incidentType: "lost-device",
      systemsAffected: "Phone",
      ongoingStatus: "no",
    });
    expect(r.errors.deviceEncrypted).toBeDefined();
  });
});

describe("validateStep — step 2", () => {
  it("requires at least one data category and harm type", () => {
    const r = validateStep(2, initialState);
    expect(r.ok).toBe(false);
    expect(r.errors.dataCategories).toBeDefined();
    expect(r.errors.harmTypes).toBeDefined();
  });

  it("passes with minimal selections", () => {
    const r = validateStep(2, {
      ...initialState,
      dataCategories: ["basic-contact"],
      numAffected: "u50",
      harmTypes: ["none"],
    });
    expect(r.ok).toBe(true);
  });
});

describe("validateStep — step 3", () => {
  it("requires sector and 2-letter jurisdiction", () => {
    const r = validateStep(3, initialState);
    expect(r.ok).toBe(false);
    expect(r.errors.sector).toBeDefined();
    expect(r.errors.jurisdiction).toBeDefined();
  });
});

describe("validateStep — step 3.5 (conditionals)", () => {
  const base = {
    ...initialState,
    controllerName: "Acme Inc",
    crossBorder: "no" as const,
    legalPrivilege: "not-engaged" as const,
  };

  it("requires processor name when thirdParty=processor", () => {
    const r = validateStep(35, { ...base, thirdParty: "processor" });
    expect(r.errors.processorName).toBeDefined();
    expect(r.errors.dpaClauseStatus).toBeDefined();
  });

  it("requires affectedMemberStates when crossBorder=yes", () => {
    const r = validateStep(35, { ...base, crossBorder: "yes" });
    expect(r.errors.affectedMemberStates).toBeDefined();
  });

  it("requires CSIRT contact for NIS2 sectors", () => {
    const r = validateStep(35, { ...base, sector: "telecom" });
    expect(r.errors.csirtContact).toBeDefined();
  });

  it("requires ICT third party for financial sector", () => {
    const r = validateStep(35, { ...base, sector: "financial" });
    expect(r.errors.ictThirdParty).toBeDefined();
  });

  it("requires outside counsel when privilege engaged", () => {
    const r = validateStep(35, { ...base, legalPrivilege: "engaged" });
    expect(r.errors.outsideCounsel).toBeDefined();
  });
});

describe("validateAll", () => {
  it("aggregates errors across every step", () => {
    const r = validateAll(initialState);
    expect(r.ok).toBe(false);
    expect(r.totalErrors).toBeGreaterThan(0);
    expect(r.perStep).toHaveLength(4);
  });
});
