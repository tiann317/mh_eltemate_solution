import type { FormState } from "../domain/types";
import { DPA_MAP, NCA_MAP } from "../domain/labels";
import { computeRiskRating, hasAnyDanger, hasAnyPersonalData, isCERSector, isFinancial, isNIS2Sector } from "../domain/classify";
import type { AIAssessment } from "../ai/types";
import {
  fallbackArt33, fallbackArt34, fallbackCer, fallbackDoraInitial,
  fallbackNis272, fallbackNis2Early, internalEscalation,
} from "./fallbacks";
import { internalLegalCounselDraft } from "./legalCounsel";

export type NotificationFramework =
  | "gdpr-art33"
  | "gdpr-art34"
  | "nis2-early-warning"
  | "nis2-72h"
  | "dora-initial"
  | "cer-art15"
  | "internal-legal-counsel"
  | "internal-escalation";

export interface NotificationDraft {
  framework: NotificationFramework;
  label: string;
  authority: string;
  recipientPlaceholder: string;
  subject: string;
  body: string;
}

export const FRAMEWORK_LABELS: Record<NotificationFramework, string> = {
  "gdpr-art33": "GDPR Art.33",
  "gdpr-art34": "GDPR Art.34",
  "nis2-early-warning": "NIS2 24h",
  "nis2-72h": "NIS2 72h",
  "dora-initial": "DORA 4h",
  "cer-art15": "CER Art.15",
  "internal-legal-counsel": "Legal counsel",
  "internal-escalation": "Internal",
};

export function buildNotificationDrafts(s: FormState, ai: AIAssessment | null): NotificationDraft[] {
  const drafts: NotificationDraft[] = [];
  const personal = hasAnyPersonalData(s.dataCategories);
  const dpa = s.jurisdiction ? DPA_MAP[s.jurisdiction] : "Lead supervisory authority";
  const nca = s.jurisdiction ? (NCA_MAP[s.jurisdiction] || "National competent authority") : "National competent authority";

  drafts.push({
    framework: "internal-legal-counsel",
    label: "Internal legal counsel brief — privileged",
    authority: s.outsideCounsel || "Internal / outside legal counsel",
    recipientPlaceholder: "legal@, outside-counsel@",
    subject: `[PRIVILEGED] ${computeRiskRating(s).toUpperCase()} incident — legal review — ${s.controllerName || "[entity]"}`,
    body: internalLegalCounselDraft(s, ai),
  });

  if (personal) {
    drafts.push({
      framework: "gdpr-art33",
      label: "GDPR Art.33 — Supervisory authority notification (72h)",
      authority: dpa,
      recipientPlaceholder: "DPA breach-notification portal email",
      subject: `Personal data breach notification — Art.33 GDPR — ${s.controllerName || "[controller]"}`,
      body: ai?.notification_draft || fallbackArt33(s),
    });
  }
  if (hasAnyDanger(s.dataCategories) || s.numAffected === "5k-50k" || s.numAffected === "o50k") {
    drafts.push({
      framework: "gdpr-art34",
      label: "GDPR Art.34 — Notification to affected individuals",
      authority: "Affected data subjects",
      recipientPlaceholder: "Distribution list / mail merge target",
      subject: `Important notice about your personal data — ${s.controllerName || "[controller]"}`,
      body: fallbackArt34(s),
    });
  }
  if (isNIS2Sector(s.sector)) {
    drafts.push({
      framework: "nis2-early-warning",
      label: "NIS2 Art.23(4)(a) — Early warning (24h)",
      authority: nca,
      recipientPlaceholder: "CSIRT / NCA reporting endpoint",
      subject: `NIS2 Early warning — ${s.controllerName || "[entity]"}`,
      body: fallbackNis2Early(s),
    });
    drafts.push({
      framework: "nis2-72h",
      label: "NIS2 Art.23(4)(b) — Incident notification (72h)",
      authority: nca,
      recipientPlaceholder: "CSIRT / NCA reporting endpoint",
      subject: `NIS2 Incident notification — ${s.controllerName || "[entity]"}`,
      body: fallbackNis272(s),
    });
  }
  if (isFinancial(s.sector)) {
    drafts.push({
      framework: "dora-initial",
      label: "DORA Art.19 — Initial report (4h after classification)",
      authority: "Financial competent authority",
      recipientPlaceholder: "Competent authority secure portal",
      subject: `DORA — Initial major ICT incident report — ${s.controllerName || "[entity]"}`,
      body: fallbackDoraInitial(s),
    });
  }
  if (isCERSector(s.sector) && s.cerOperator) {
    drafts.push({
      framework: "cer-art15",
      label: "CER Art.15 — Incident notification (24h)",
      authority: nca,
      recipientPlaceholder: "CER competent authority",
      subject: `CER incident notification — ${s.controllerName || "[entity]"}`,
      body: fallbackCer(s),
    });
  }
  drafts.push({
    framework: "internal-escalation",
    label: "Internal escalation — CISO / CEO",
    authority: "Senior leadership",
    recipientPlaceholder: "ciso@, ceo@",
    subject: `[${computeRiskRating(s).toUpperCase()}] Incident escalation — ${s.controllerName || "[entity]"}`,
    body: internalEscalation(s, ai),
  });
  return drafts;
}
