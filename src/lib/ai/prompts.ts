import type { FormState } from "../domain/types";
import {
  DATA_CATEGORY_LABELS, DPA_MAP, HARM_LABELS, INCIDENT_TYPE_LABELS,
  NUM_AFFECTED_LABELS, ONGOING_LABELS, SECTOR_LABELS, THIRD_PARTY_LABELS,
} from "../domain/labels";

// GDPR Art.33, Art.34, Art.9, Art.4(12), Art.32, Art.5(1)(f), Art.30,
// Recital 85, NIS2 Art.23, DORA Art.19, CER Art.15
export const OPENAI_SYSTEM_PROMPT = `You are a GDPR and EU data protection law expert assistant helping legal and compliance teams respond to personal data breaches. You have deep knowledge of GDPR, NIS2 Directive (2022/2555), DORA (2022/2554), the CER Directive (2022/2557), and EDPB personal data breach notification guidelines (WP250 rev.01).

Your role is to:
1. Provide a structured risk assessment for the breach described
2. Draft an initial Art.33 GDPR supervisory authority notification letter
3. Draft a short internal escalation alert for senior leadership (CISO / CEO)
4. For EVERY recommended technical action, attach the specific statutory legal basis that justifies and/or compels that action.
5. Build a structured lawyer handoff packet for outside counsel.

Rules:
- Always cite specific legal provisions: Art.33, Art.34, Art.9, Art.4(12), Art.32, Art.5(1)(f), Art.30, Recital 85, NIS2 Art.23, DORA Art.19, CER Art.15
- For each recommended action, choose the most precise primary citation
- Apply EDPB Guidelines on personal data breach notification (WP250 rev.01)
- Never advise that Art.33 notification is not required where Art.9 special category data is confirmed
- Return ONLY valid JSON in the exact schema below.

Schema:
{
  "risk_assessment": "3-4 sentences",
  "key_gaps": ["gap 1"],
  "notification_draft": "Full Art.33 notification letter text",
  "internal_alert": "5-6 line internal escalation",
  "lawyer_handoff": "6-8 line handoff summary",
  "recommended_actions": [
    { "action": "immediate technical action", "legal_basis": "GDPR Art.32(1)(b)", "rationale": "..." }
  ],
  "lawyer_packet": {
    "incident_summary": "1-2 line summary",
    "frameworks_triggered": ["GDPR", "NIS2"],
    "active_deadlines": [{ "framework": "GDPR Art.33", "deadline": "72h", "status": "running" }],
    "decisions_needed": ["..."],
    "privilege_note": "...",
    "open_questions": ["..."]
  }
}`;

export const buildUserMessage = (
  s: FormState,
  firedAlerts: { title: string; cite: string }[],
): string => {
  const list = (arr: string[]) => (arr.length ? arr.join(", ") : "none");
  return `Breach incident report — please assess and draft notifications:

DISCOVERY
- Time of discovery: ${s.discoveryTime || "not recorded"}
- Incident type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "not specified"}
- Systems affected: ${s.systemsAffected || "not specified"}
- Incident status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "not specified"}

DATA & PEOPLE
- Data categories selected: ${list(s.dataCategories.map(c => DATA_CATEGORY_LABELS[c]))}
- Number of individuals affected: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "not specified"}
- Potential harm types: ${list(s.harmTypes.map(h => HARM_LABELS[h]))}

ORGANISATION
- Sector: ${s.sector ? SECTOR_LABELS[s.sector] : "not specified"}
- Lead jurisdiction / DPA: ${s.jurisdiction ? DPA_MAP[s.jurisdiction] : "not specified"}
- Third party involvement: ${s.thirdParty ? THIRD_PARTY_LABELS[s.thirdParty] : "not specified"}

LEGAL CONTEXT
- Controller: ${s.controllerName || "not provided"}
- DPO contact: ${s.dpoContact || "not provided"}
- Processor (if any): ${s.processorName || "n/a"}
- DPA (Art.28) clause status: ${s.dpaClauseStatus || "not assessed"}
- Cross-border processing: ${s.crossBorder || "not assessed"}
- Affected EU member states: ${s.affectedMemberStates || "n/a"}
- CSIRT / NCA contact (NIS2): ${s.csirtContact || "n/a"}
- ICT third-party provider (DORA): ${s.ictThirdParty || "n/a"}
- CER critical-entity operator: ${s.cerOperator ? "yes" : "no"}
- Legal privilege engaged: ${s.legalPrivilege || "not specified"}
- Outside counsel: ${s.outsideCounsel || "n/a"}
- Audit/evidence retention basis stated by org: ${s.retentionBasis || "n/a"}

DETERMINISTIC RULE ENGINE — ALERTS ALREADY TRIGGERED:
${firedAlerts.length ? firedAlerts.map(a => `• ${a.title} — ${a.cite}`).join("\n") : "• none"}

Please return your JSON response only.`;
};
