import { describe, expect, it } from "vitest";
import { normalizeAction } from "@/lib/ai/types";

describe("normalizeAction", () => {
  it("returns objects unchanged", () => {
    const a = { action: "x", legal_basis: "GDPR Art.33", rationale: "y" };
    expect(normalizeAction(a)).toBe(a);
  });

  it("wraps strings with a default GDPR Art.32(1)(b) basis", () => {
    const r = normalizeAction("Rotate creds");
    expect(r.action).toBe("Rotate creds");
    expect(r.legal_basis).toBe("GDPR Art.32(1)(b)");
    expect(r.rationale).toMatch(/security of processing/i);
  });
});
