import { describe, expect, it } from "vitest";
import { initialState } from "@/lib/domain/types";
import { buildNotificationDrafts } from "@/lib/notifications/drafts";

const baseState = (overrides: Partial<typeof initialState> = {}) => ({
  ...initialState,
  controllerName: "Acme Ltd",
  jurisdiction: "DE" as const,
  ...overrides,
});

describe("buildNotificationDrafts", () => {
  it("always includes legal counsel brief and internal escalation", () => {
    const drafts = buildNotificationDrafts(baseState(), null);
    const frameworks = drafts.map((d) => d.framework);
    expect(frameworks).toContain("internal-legal-counsel");
    expect(frameworks).toContain("internal-escalation");
  });

  it("emits Art.33 only when personal data present", () => {
    const empty = buildNotificationDrafts(baseState(), null);
    expect(empty.find((d) => d.framework === "gdpr-art33")).toBeUndefined();

    const withData = buildNotificationDrafts(baseState({ dataCategories: ["basic-contact"] }), null);
    expect(withData.find((d) => d.framework === "gdpr-art33")).toBeDefined();
  });

  it("emits Art.34 for special-category data", () => {
    const drafts = buildNotificationDrafts(baseState({ dataCategories: ["health"] }), null);
    expect(drafts.find((d) => d.framework === "gdpr-art34")).toBeDefined();
  });

  it("emits NIS2 early + 72h drafts for NIS2 sectors", () => {
    const drafts = buildNotificationDrafts(baseState({ sector: "energy" }), null);
    expect(drafts.find((d) => d.framework === "nis2-early-warning")).toBeDefined();
    expect(drafts.find((d) => d.framework === "nis2-72h")).toBeDefined();
  });

  it("emits DORA initial for financial sector", () => {
    const drafts = buildNotificationDrafts(baseState({ sector: "financial" }), null);
    expect(drafts.find((d) => d.framework === "dora-initial")).toBeDefined();
  });

  it("emits CER Art.15 only with cerOperator=true", () => {
    expect(
      buildNotificationDrafts(baseState({ sector: "energy" }), null)
        .find((d) => d.framework === "cer-art15"),
    ).toBeUndefined();
    expect(
      buildNotificationDrafts(baseState({ sector: "energy", cerOperator: true }), null)
        .find((d) => d.framework === "cer-art15"),
    ).toBeDefined();
  });

  it("uses AI notification draft when supplied", () => {
    const drafts = buildNotificationDrafts(
      baseState({ dataCategories: ["basic-contact"] }),
      {
        risk_assessment: "", key_gaps: [], notification_draft: "AI-DRAFT-BODY",
        internal_alert: "", lawyer_handoff: "", recommended_actions: [],
      },
    );
    expect(drafts.find((d) => d.framework === "gdpr-art33")?.body).toBe("AI-DRAFT-BODY");
  });
});
