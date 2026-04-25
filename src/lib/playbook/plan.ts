import type { FormState } from "../domain/types";
import { getDeadlines } from "../domain/deadlines";
import type { AIAssessment } from "../ai/types";
import { normalizeAction } from "../ai/types";

export type PriorityLevel = "P0" | "P1" | "P2" | "P3";

export interface PrioritizedAction {
  key: string;
  priority: PriorityLevel;
  urgencyHours: number | null;
  title: string;
  detail: string;
  legalBasis: string;
  source: "deadline" | "notification" | "tech-action" | "security" | "decision";
  framework?: string;
}

const priorityFromHours = (h: number | null): PriorityLevel => {
  if (h === null) return "P2";
  if (h < 0) return "P0";
  if (h < 4) return "P0";
  if (h < 24) return "P1";
  if (h < 72) return "P2";
  return "P3";
};

const priorityFromTag = (tag?: string): PriorityLevel => {
  if (!tag) return "P2";
  const t = tag.toUpperCase();
  if (t.includes("P0") || t.includes("CRITICAL")) return "P0";
  if (t.includes("P1") || t.includes("HIGH")) return "P1";
  if (t.includes("P3") || t.includes("LOW")) return "P3";
  return "P2";
};

const PRIORITY_RANK: Record<PriorityLevel, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function buildPrioritizedPlan(
  s: FormState,
  ai: AIAssessment | null,
  discoveredMs: number,
  notificationStatuses: { framework: string; status: string }[] = [],
): PrioritizedAction[] {
  const out: PrioritizedAction[] = [];
  const now = Date.now();

  for (const d of getDeadlines(s).filter(x => x.applies)) {
    const deadlineMs = discoveredMs + d.hours * 3_600_000;
    const remainingH = (deadlineMs - now) / 3_600_000;
    const sentMatch = notificationStatuses.some(n =>
      n.status === "sent" && d.framework.toLowerCase().includes(n.framework.split("-")[0]),
    );
    if (sentMatch) continue;
    out.push({
      key: `deadline:${d.framework}:${d.label}`,
      priority: priorityFromHours(remainingH),
      urgencyHours: remainingH,
      title: `${d.framework} — ${d.label}`,
      detail: remainingH < 0
        ? `OVERDUE by ${Math.abs(Math.round(remainingH))}h. Notify immediately and document delay reasoning under Art.33(1).`
        : `${Math.max(0, Math.round(remainingH))}h remaining from discovery. Notification window is statutory.`,
      legalBasis: d.framework,
      source: "deadline",
      framework: d.framework,
    });
  }

  for (const n of notificationStatuses) {
    if (n.status === "sent") continue;
    out.push({
      key: `notification:${n.framework}`,
      priority: "P1",
      urgencyHours: null,
      title: `Send ${n.framework} notification draft`,
      detail: "Draft is pre-populated in the Notifications panel. Review, finalise recipient and mark as sent — sending is recorded in the audit trail.",
      legalBasis: n.framework.toUpperCase().includes("GDPR") ? "GDPR Art.33" : n.framework.toUpperCase(),
      source: "notification",
      framework: n.framework,
    });
  }

  for (const [i, m] of (ai?.security_playbook ?? []).entries()) {
    out.push({
      key: `security:${i}`,
      priority: priorityFromTag(m.priority),
      urgencyHours: null,
      title: m.measure,
      detail: m.rationale,
      legalBasis: m.legal_basis,
      source: "security",
    });
  }

  for (const [i, raw] of (ai?.recommended_actions ?? []).entries()) {
    const a = normalizeAction(raw);
    out.push({
      key: `tech:${i}`,
      priority: "P2",
      urgencyHours: null,
      title: a.action,
      detail: a.rationale,
      legalBasis: a.legal_basis,
      source: "tech-action",
    });
  }

  for (const [i, d] of (ai?.lawyer_packet?.decisions_needed ?? []).entries()) {
    out.push({
      key: `decision:${i}`,
      priority: "P2",
      urgencyHours: null,
      title: d,
      detail: "Decision required from counsel before proceeding. Capture rationale in the audit log.",
      legalBasis: "GDPR Art.33(5) — duty to document",
      source: "decision",
    });
  }

  out.sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    const ah = a.urgencyHours ?? Number.POSITIVE_INFINITY;
    const bh = b.urgencyHours ?? Number.POSITIVE_INFINITY;
    return ah - bh;
  });

  return out;
}

export interface OutstandingAction {
  kind: "deadline" | "notification" | "decision";
  framework?: string;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
}

export function computeOutstanding(
  s: FormState,
  discoveredMs: number,
  notificationStatuses: { framework: string; status: string }[],
  decisionsNeeded: string[],
): OutstandingAction[] {
  const out: OutstandingAction[] = [];
  const now = Date.now();

  for (const d of getDeadlines(s).filter(x => x.applies)) {
    const deadlineMs = discoveredMs + d.hours * 3_600_000;
    const remainingH = (deadlineMs - now) / 3_600_000;
    const sentMatching = notificationStatuses.some(n =>
      n.status === "sent" && d.framework.toLowerCase().includes(n.framework.split("-")[0]),
    );
    if (sentMatching) continue;
    const severity: OutstandingAction["severity"] =
      remainingH < 0 ? "critical" : remainingH < 4 ? "critical" : remainingH < 24 ? "high" : "medium";
    out.push({
      kind: "deadline",
      framework: d.framework,
      label: `${d.label}${remainingH < 0 ? " — OVERDUE" : ""}`,
      severity,
    });
  }
  for (const n of notificationStatuses) {
    if (n.status !== "sent") {
      out.push({
        kind: "notification",
        framework: n.framework,
        label: `${n.framework} draft awaiting send`,
        severity: "medium",
      });
    }
  }
  for (const d of decisionsNeeded) {
    out.push({ kind: "decision", label: d, severity: "low" });
  }
  return out;
}
