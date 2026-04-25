import { describe, expect, it } from "vitest";
import { TOP_TEN_PROMPTS, classifyLiteracy } from "@/lib/literacy";

describe("classifyLiteracy", () => {
  it("returns qualified when keyword + 2 yes self-checks", () => {
    expect(
      classifyLiteracy({
        title: "CISO",
        selfCheck1: "yes",
        selfCheck2: "yes",
        selfCheck3: "unsure",
      }),
    ).toBe("qualified");
  });

  it("returns qualified with no keyword but all 3 confident yes", () => {
    expect(
      classifyLiteracy({
        title: "Office manager",
        selfCheck1: "yes",
        selfCheck2: "yes",
        selfCheck3: "yes",
      }),
    ).toBe("qualified");
  });

  it("returns non_qualified when 2+ no answers regardless of title", () => {
    expect(
      classifyLiteracy({
        title: "DPO",
        selfCheck1: "no",
        selfCheck2: "no",
        selfCheck3: "yes",
      }),
    ).toBe("non_qualified");
  });

  it("defaults to non_qualified when uncertain", () => {
    expect(classifyLiteracy({})).toBe("non_qualified");
    expect(classifyLiteracy({ title: "Engineer" })).toBe("non_qualified");
  });

  it("matches keywords case-insensitively across title/role/department", () => {
    expect(
      classifyLiteracy({
        department: "Information Security",
        selfCheck1: "yes",
        selfCheck2: "yes",
      }),
    ).toBe("qualified");
  });
});

describe("TOP_TEN_PROMPTS", () => {
  it("has exactly 10 plain-language prompts with q + hint", () => {
    expect(TOP_TEN_PROMPTS).toHaveLength(10);
    for (const p of TOP_TEN_PROMPTS) {
      expect(p.q.length).toBeGreaterThan(0);
      expect(p.hint.length).toBeGreaterThan(0);
    }
  });
});
