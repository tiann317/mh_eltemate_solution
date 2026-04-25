import { describe, expect, it } from "vitest";
import { classifyAuditMessage, splitTimestamp } from "@/lib/auditClassify";

describe("classifyAuditMessage", () => {
  it("classifies session lifecycle as governance", () => {
    const c = classifyAuditMessage("Session started by responder");
    expect(c.category).toBe("governance");
    expect(c.source).toBe("system");
  });

  it("classifies AI assessment messages as AI gateway / assessment", () => {
    const c = classifyAuditMessage("AI assessment completed via OpenAI gpt-4");
    expect(c.source).toBe("ai-gateway");
    expect(c.category).toBe("assessment");
  });

  it("classifies LDA queries with the legal-requirements ISO control", () => {
    const c = classifyAuditMessage("LDA legal database queried for GDPR Art.33");
    expect(c.source).toBe("lda-legal-db");
    expect(c.isoControl).toMatch(/27002/);
  });

  it("classifies notification dispatch as response", () => {
    const c = classifyAuditMessage("Marked GDPR-Art33 as sent");
    expect(c.category).toBe("response");
    expect(c.source).toBe("responder-action");
  });

  it("falls back to governance for unknown messages", () => {
    const c = classifyAuditMessage("totally unrecognised message");
    expect(c.category).toBe("governance");
  });
});

describe("splitTimestamp", () => {
  it("extracts a [timestamp] — body prefix", () => {
    const r = splitTimestamp("[01 Jan 2026 09:00:00] — Session started");
    expect(r.ts).toBe("01 Jan 2026 09:00:00");
    expect(r.body).toBe("Session started");
  });

  it("returns null timestamp when no prefix is present", () => {
    const r = splitTimestamp("Session started");
    expect(r.ts).toBeNull();
    expect(r.body).toBe("Session started");
  });
});
