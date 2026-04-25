import { describe, expect, it } from "vitest";
import { initialState } from "@/lib/domain/types";
import { getDeadlines } from "@/lib/domain/deadlines";

const find = (s: ReturnType<typeof getDeadlines>, framework: string, label: string) =>
  s.find((d) => d.framework === framework && d.label === label);

describe("getDeadlines", () => {
  it("returns a single non-applying GDPR Art.33 entry for empty state", () => {
    const out = getDeadlines(initialState);
    expect(out).toHaveLength(1);
    expect(out[0].framework).toBe("GDPR Art.33");
    expect(out[0].applies).toBe(false);
  });

  it("activates GDPR Art.33 once any personal data is selected", () => {
    const out = getDeadlines({ ...initialState, dataCategories: ["basic-contact"] });
    expect(find(out, "GDPR Art.33", "DPA notification (72h)")?.applies).toBe(true);
  });

  it("triggers Art.34 when special category data present", () => {
    const out = getDeadlines({ ...initialState, dataCategories: ["health"] });
    expect(find(out, "GDPR Art.34", "Individual notification (without undue delay)")).toBeDefined();
  });

  it("triggers Art.34 on high-volume even without special category", () => {
    const out = getDeadlines({ ...initialState, dataCategories: ["basic-contact"], numAffected: "o50k" });
    expect(find(out, "GDPR Art.34", "Individual notification (without undue delay)")).toBeDefined();
  });

  it("adds NIS2 24h + 72h deadlines for NIS2 sectors", () => {
    const out = getDeadlines({ ...initialState, sector: "energy" });
    expect(out.find((d) => d.framework === "NIS2 Art.23" && d.hours === 24)).toBeDefined();
    expect(out.find((d) => d.framework === "NIS2 Art.23" && d.hours === 72)).toBeDefined();
  });

  it("adds DORA 4h deadline for financial sector", () => {
    const out = getDeadlines({ ...initialState, sector: "financial" });
    const dora = out.find((d) => d.framework === "DORA Art.19");
    expect(dora?.hours).toBe(4);
  });

  it("adds CER 24h deadline only when energy/transport AND cerOperator", () => {
    expect(getDeadlines({ ...initialState, sector: "energy" }).find((d) => d.framework === "CER Art.15")).toBeUndefined();
    const out = getDeadlines({ ...initialState, sector: "energy", cerOperator: true });
    expect(out.find((d) => d.framework === "CER Art.15")?.hours).toBe(24);
  });
});
