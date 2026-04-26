// Audit-log enrichment for ISO-aligned, business-auditable evidence.
//
// Maps each free-text audit message to:
//   • source       — where the data came from (which subsystem produced it)
//   • category     — ISO 27035 incident-management lifecycle stage
//   • isoControl   — anchoring control reference from ISO/IEC 27001:2022 Annex A
//                    and ISO/IEC 27002:2022 (control set), plus ISO 27035-1
//                    for incident-management process steps
//
// The goal is that any auditor reading the log can trace each entry to:
//   1. a system-of-record (data provenance), and
//   2. a recognised control objective.

export type AuditSource =
  | "user-form"           // entered by responder via the intake form
  | "rules-engine"        // Aegis statute-mapping rules (client-side)
  | "lda-legal-db"        // LDA cited-source legal database
  | "ai-gateway"          // Lovable AI Gateway (model output)
  | "database"            // Supabase persistence layer
  | "responder-action"    // explicit click / mark-done / send / oversight
  | "system";             // session lifecycle, validation, plotting

export type AuditCategory =
  | "detection"           // ISO 27035-1 §5.4 Detection & reporting
  | "assessment"          // ISO 27035-1 §5.5 Assessment & decision
  | "response"            // ISO 27035-1 §5.6 Responses
  | "lessons"             // ISO 27035-1 §5.7 Lessons learnt
  | "evidence"            // ISO 27037 evidence handling
  | "governance";         // ISO 27001 Clause 5 / 9 — leadership & monitoring

export interface AuditClassification {
  source: AuditSource;
  sourceLabel: string;
  category: AuditCategory;
  categoryLabel: string;
  isoControl: string;     // e.g. "ISO/IEC 27001 A.5.24"
  isoControlTitle: string;
}

// Keyword → classification rules, evaluated top-to-bottom (first match wins).
const RULES: { test: RegExp; cls: AuditClassification }[] = [
  {
    test: /session started/i,
    cls: {
      source: "system", sourceLabel: "Aegis session lifecycle",
      category: "governance", categoryLabel: "Governance",
      isoControl: "ISO/IEC 27001 A.5.24",
      isoControlTitle: "Information security incident management planning & preparation",
    },
  },
  {
    test: /lda legal database — token acquired/i,
    cls: {
      source: "lda-legal-db", sourceLabel: "LDA legal database (auth)",
      category: "governance", categoryLabel: "Governance",
      isoControl: "ISO/IEC 27002:2022 §5.31",
      isoControlTitle: "Legal, statutory, regulatory & contractual requirements",
    },
  },
  {
    test: /lda legal database — credentials not configured/i,
    cls: {
      source: "system", sourceLabel: "Aegis configuration",
      category: "governance", categoryLabel: "Governance",
      isoControl: "ISO/IEC 27001 A.5.31",
      isoControlTitle: "Identification of legal requirements (degraded — no cited sources)",
    },
  },
  {
    test: /lda legal database queried/i,
    cls: {
      source: "lda-legal-db", sourceLabel: "LDA legal database",
      category: "assessment", categoryLabel: "Assessment & decision",
      isoControl: "ISO/IEC 27002:2022 §5.31",
      isoControlTitle: "Legal & regulatory requirements lookup",
    },
  },
  {
    test: /law layer queried|lda response received/i,
    cls: {
      source: "lda-legal-db", sourceLabel: "LDA legal database",
      category: "evidence", categoryLabel: "Evidence",
      isoControl: "ISO/IEC 27037 §6.3",
      isoControlTitle: "Identification of digital evidence (cited sources captured)",
    },
  },
  {
    test: /openai|gpt-?[0-9]|gemini|ai assessment|ai gateway/i,
    cls: {
      source: "ai-gateway", sourceLabel: "Lovable AI Gateway",
      category: "assessment", categoryLabel: "Assessment & decision",
      isoControl: "ISO/IEC 27001 A.5.25",
      isoControlTitle: "Assessment of and decision on information security events",
    },
  },
  {
    test: /discovery time recorded/i,
    cls: {
      source: "user-form", sourceLabel: "Responder intake form",
      category: "detection", categoryLabel: "Detection & reporting",
      isoControl: "ISO/IEC 27035-1:2023 §5.4",
      isoControlTitle: "Detection of an information security event",
    },
  },
  {
    test: /incident type selected|sector selected|jurisdiction selected|third party|data categories selected/i,
    cls: {
      source: "user-form", sourceLabel: "Responder intake form",
      category: "detection", categoryLabel: "Detection & reporting",
      isoControl: "ISO/IEC 27035-1:2023 §5.4",
      isoControlTitle: "Reporting an information security event",
    },
  },
  {
    test: /alert fired/i,
    cls: {
      source: "rules-engine", sourceLabel: "Aegis rules engine",
      category: "assessment", categoryLabel: "Assessment & decision",
      isoControl: "ISO/IEC 27001 A.5.25",
      isoControlTitle: "Decision triggers based on statutory thresholds",
    },
  },
  {
    test: /risk matrix plotted|risk rating/i,
    cls: {
      source: "rules-engine", sourceLabel: "Aegis rules engine",
      category: "assessment", categoryLabel: "Assessment & decision",
      isoControl: "ISO/IEC 27005:2022 §8",
      isoControlTitle: "Information security risk assessment",
    },
  },
  {
    test: /draft.*notification|art\.?\s*33 notification|internal escalation alert|lawyer handoff/i,
    cls: {
      source: "ai-gateway", sourceLabel: "Lovable AI Gateway (draft)",
      category: "response", categoryLabel: "Response",
      isoControl: "ISO/IEC 27001 A.5.5",
      isoControlTitle: "Contact with authorities (notification drafting)",
    },
  },
  {
    test: /tech track activated|legal track activated|immediate actions checklist/i,
    cls: {
      source: "system", sourceLabel: "Aegis orchestration",
      category: "response", categoryLabel: "Response",
      isoControl: "ISO/IEC 27001 A.5.26",
      isoControlTitle: "Response to information security incidents",
    },
  },
  {
    test: /validation blocked|validated/i,
    cls: {
      source: "system", sourceLabel: "Aegis form validator",
      category: "governance", categoryLabel: "Governance",
      isoControl: "ISO/IEC 27001 Clause 9.1",
      isoControlTitle: "Monitoring, measurement, analysis & evaluation",
    },
  },
  {
    test: /persisted to dashboard|incident persisted/i,
    cls: {
      source: "database", sourceLabel: "Lovable Cloud (Postgres)",
      category: "evidence", categoryLabel: "Evidence",
      isoControl: "ISO/IEC 27001 A.5.28",
      isoControlTitle: "Collection of evidence",
    },
  },
  {
    test: /marked.*as sent|notification sent|sent via/i,
    cls: {
      source: "responder-action", sourceLabel: "Responder action",
      category: "response", categoryLabel: "Response",
      isoControl: "ISO/IEC 27001 A.5.5",
      isoControlTitle: "Contact with authorities (notification dispatched)",
    },
  },
  {
    test: /marked.*done|action completed/i,
    cls: {
      source: "responder-action", sourceLabel: "Responder action",
      category: "response", categoryLabel: "Response",
      isoControl: "ISO/IEC 27001 A.5.26",
      isoControlTitle: "Response to information security incidents",
    },
  },
  {
    test: /oversight requested|escalat/i,
    cls: {
      source: "responder-action", sourceLabel: "Responder action",
      category: "governance", categoryLabel: "Governance",
      isoControl: "ISO/IEC 27001 A.5.4",
      isoControlTitle: "Management responsibilities (escalation to oversight)",
    },
  },
  {
    test: /assessment displayed|assessment generation started/i,
    cls: {
      source: "system", sourceLabel: "Aegis orchestration",
      category: "assessment", categoryLabel: "Assessment & decision",
      isoControl: "ISO/IEC 27001 A.5.25",
      isoControlTitle: "Assessment of and decision on information security events",
    },
  },
];

const FALLBACK: AuditClassification = {
  source: "system", sourceLabel: "Aegis system",
  category: "governance", categoryLabel: "Governance",
  isoControl: "ISO/IEC 27001 A.5.24",
  isoControlTitle: "Incident management activity",
};

export function classifyAuditMessage(message: string): AuditClassification {
  for (const r of RULES) if (r.test.test(message)) return r.cls;
  return FALLBACK;
}

// Strip leading "[timestamp] — " prefix produced by fmtTimestamp() in aegis.ts
export function splitTimestamp(message: string): { ts: string | null; body: string } {
  const m = message.match(/^\[([^\]]+)\]\s*—\s*(.*)$/);
  if (m) return { ts: m[1], body: m[2] };
  return { ts: null, body: message };
}
