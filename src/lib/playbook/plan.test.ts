import { describe, expect, it } from "vitest";
import { initialState } from "@/lib/domain/types";
import { buildPrioritizedPlan, computeOutstanding } from "@/lib/playbook/plan";
import type { AIAssessment } from "@/lib/ai/types";

const HOUR = 3_600_000;

describe("buildPrioritizedPlan — deadlines", () => {
  it("flags overdue deadlines as P0", () => {
    const discovered = Date.now() - 100 * HOUR; // 100h ago, past 72h
    const plan = buildPrioritizedPlan(
      { ...initialState, dataCategories: ["basic-contact"] },
      null,
      discovered,
    );
    const art33 = plan.find((p) => p.title.includes("GDPR Art.33"));
    expect(art33?.priority).toBe("P0");
    expect(art33?.detail).toMatch(/OVERDUE/);
  });

  it("DORA 4h within first hour is still P0", () => {
    const plan = buildPrioritizedPlan(
      { ...initialState, sector: "financial" },
      null,
      Date.now() - 1 * HOUR,
    );
    const dora = plan.find((p) => p.title.includes("DORA"));
    expect(dora?.priority).toBe("P0");
  });

  it("ignores deadlines whose notification has been sent", () => {
    const plan = buildPrioritizedPlan(
      { ...initialState, dataCategories: ["basic-contact"] },
      null,
      Date.now() - 1 * HOUR,
      [{ framework: "gdpr-art33", status: "sent" }],
    );
    expect(plan.find((p) => p.title.includes("GDPR Art.33"))).toBeUndefined();
  });

  it("sorts by priority then urgency", () => {
    const plan = buildPrioritizedPlan(
      { ...initialState, dataCategories: ["health"], sector: "financial" },
      null,
      Date.now() - 1 * HOUR,
    );
    const ranks = plan.map((p) => p.priority);
    const sorted = [...ranks].sort();
    expect(ranks).toEqual(sorted);
  });
});

describe("buildPrioritizedPlan — AI inputs", () => {
  const ai: AIAssessment = {
    risk_assessment: "x",
    key_gaps: [],
    notification_draft: "",
    internal_alert: "",
    lawyer_handoff: "",
    recommended_actions: [
      { action: "Rotate keys", legal_basis: "GDPR Art.32(1)(b)", rationale: "stolen creds" },
      "string-form action",
    ],
    security_playbook: [
      { measure: "Block C2", legal_basis: "NIS2 Art.21", priority: "P0", rationale: "active intrusion" },
      { measure: "Patch Vuln", legal_basis: "GDPR Art.32(1)(d)", priority: "low", rationale: "hygiene" },
    ],
    lawyer_packet: {
      incident_summary: "x", frameworks_triggered: ["GDPR"], active_deadlines: [],
      decisions_needed: ["Approve Art.34 letter"], privilege_note: "", open_questions: [],
    },
  };

  it("normalises string actions and extracts each input", () => {
    const plan = buildPrioritizedPlan(initialState, ai, Date.now());
    expect(plan.find((p) => p.title === "Rotate keys")?.source).toBe("tech-action");
    expect(plan.find((p) => p.title === "string-form action")?.legalBasis).toBe("GDPR Art.32(1)(b)");
    expect(plan.find((p) => p.title === "Block C2")?.priority).toBe("P0");
    expect(plan.find((p) => p.title === "Patch Vuln")?.priority).toBe("P3");
    expect(plan.find((p) => p.title === "Approve Art.34 letter")?.source).toBe("decision");
  });
});

describe("computeOutstanding", () => {
  it("marks overdue deadline as critical", () => {
    const out = computeOutstanding(
      { ...initialState, dataCategories: ["basic-contact"] },
      Date.now() - 100 * HOUR,
      [],
      [],
    );
    expect(out[0].kind).toBe("deadline");
    expect(out[0].severity).toBe("critical");
    expect(out[0].label).toMatch(/OVERDUE/);
  });

  it("includes pending notifications and decisions", () => {
    const out = computeOutstanding(
      initialState,
      Date.now(),
      [{ framework: "gdpr-art33", status: "draft" }],
      ["Confirm Art.34 trigger"],
    );
    expect(out.some((o) => o.kind === "notification")).toBe(true);
    expect(out.some((o) => o.kind === "decision")).toBe(true);
  });
});
