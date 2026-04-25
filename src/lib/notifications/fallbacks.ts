import type { FormState } from "../domain/types";
import {
  DATA_CATEGORY_LABELS, DPA_MAP, HARM_LABELS, INCIDENT_TYPE_LABELS,
  NUM_AFFECTED_LABELS, ONGOING_LABELS, SECTOR_LABELS,
} from "../domain/labels";
import { computeRiskRating, hasAnyPersonalData, isCERSector, isFinancial, isNIS2Sector } from "../domain/classify";
import type { AIAssessment } from "../ai/types";

// GDPR Art.33 — Notification to supervisory authority
export const fallbackArt33 = (s: FormState) => `Dear Sir/Madam,

In accordance with Article 33 of the General Data Protection Regulation (Regulation (EU) 2016/679, "GDPR"), we are notifying ${s.jurisdiction ? DPA_MAP[s.jurisdiction] : "the competent supervisory authority"} of a personal data breach.

1. Nature of the breach
   - Discovered on: ${s.discoveryTime || "[discovery time]"}
   - Incident type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[incident type]"}
   - Systems affected: ${s.systemsAffected || "[systems]"}
   - Containment status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}

2. Categories and approximate number of data subjects concerned
   - Categories: ${s.dataCategories.length ? s.dataCategories.map(c => DATA_CATEGORY_LABELS[c]).join("; ") : "[under investigation]"}
   - Approximate number affected: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "[under investigation]"}

3. Likely consequences of the breach
   - ${s.harmTypes.length ? s.harmTypes.map(h => HARM_LABELS[h]).join("; ") : "Under assessment"}

4. Measures taken or proposed
   - Containment, forensic investigation and evidence preservation are underway.
   - This notification is interim; further information will follow under Article 33(4).

5. Contact point
   - Controller: ${s.controllerName || "[controller name]"}
   - Data Protection Officer: ${s.dpoContact || "[DPO contact]"}

We acknowledge our continuing obligations under Articles 33(3), 33(4) and 33(5) GDPR.

Yours faithfully,
${s.controllerName || "[Controller]"}`;

// GDPR Art.34 — Communication to data subject
export const fallbackArt34 = (s: FormState) => `Dear data subject,

We are writing to inform you, in accordance with Article 34 of the GDPR, that we have identified a personal data breach affecting your personal data.

What happened
On ${s.discoveryTime || "[date]"} we discovered ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType].toLowerCase() : "an incident"} affecting ${s.systemsAffected || "one of our systems"}.

What information was involved
${s.dataCategories.length ? s.dataCategories.map(c => `• ${DATA_CATEGORY_LABELS[c]}`).join("\n") : "• Under investigation"}

What we are doing
We have engaged our security team and, where appropriate, law enforcement and external counsel. We have notified ${s.jurisdiction ? DPA_MAP[s.jurisdiction] : "the competent supervisory authority"}.

What you can do
${s.dataCategories.includes("credentials") ? "• Reset any password you used on the affected service and any service where you reused that password.\n" : ""}${s.dataCategories.includes("financial") ? "• Monitor your bank/card statements and alert your card issuer to any unrecognised activity.\n" : ""}• Be alert to phishing communications referencing this incident.

Contact
If you have questions you may contact our Data Protection Officer at ${s.dpoContact || "[DPO contact]"}.

We sincerely regret this incident.

${s.controllerName || "[Controller]"}`;

// NIS2 Directive 2022/2555, Art.23(4)(a) — Early warning (24h)
export const fallbackNis2Early = (s: FormState) => `EARLY WARNING — NIS2 Article 23(4)(a)

Reporting entity: ${s.controllerName || "[entity]"}
Sector: ${s.sector ? SECTOR_LABELS[s.sector] : "[sector]"}
Time of detection: ${s.discoveryTime || "[time]"}

Initial assessment:
- Suspected significant incident affecting ${s.systemsAffected || "[systems]"}.
- Suspected to be caused by unlawful or malicious acts: under assessment.
- May have a cross-border impact: ${s.crossBorder === "yes" ? `yes — ${s.affectedMemberStates || "member states under assessment"}` : s.crossBorder === "no" ? "no" : "under assessment"}.

A formal incident notification under Article 23(4)(b) will follow within 72 hours.

Contact: ${s.dpoContact || s.csirtContact || "[contact]"}`;

// NIS2 Art.23(4)(b) — Incident notification (72h)
export const fallbackNis272 = (s: FormState) => `INCIDENT NOTIFICATION — NIS2 Article 23(4)(b)

Reporting entity: ${s.controllerName || "[entity]"}
Sector: ${s.sector ? SECTOR_LABELS[s.sector] : "[sector]"}

1. Update on the early warning
   - Time of detection: ${s.discoveryTime || "[time]"}
   - Current containment status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}

2. Initial assessment of the incident
   - Severity / impact: ${computeRiskRating(s)} risk rating (deterministic).
   - Affected services: ${s.systemsAffected || "[systems]"}
   - Cross-border impact: ${s.crossBorder === "yes" ? s.affectedMemberStates || "yes — member states under assessment" : s.crossBorder || "under assessment"}.

3. Indicators of compromise
   - To be supplied as available.

4. Mitigation measures
   - Containment, forensic investigation, log preservation and stakeholder notification underway.

A final report under Article 23(4)(c) will follow within one month.

Contact: ${s.csirtContact || s.dpoContact || "[contact]"}`;

// DORA Regulation 2022/2554, Art.19(4)(a) — Initial report (4h after classification)
export const fallbackDoraInitial = (s: FormState) => `INITIAL INCIDENT REPORT — DORA Article 19(4)(a)

Financial entity: ${s.controllerName || "[entity]"}
Classification: Major ICT-related incident (preliminary)
Time of detection: ${s.discoveryTime || "[time]"}
Time of classification as major: [to be confirmed]

1. Incident description
   - Type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[type]"}
   - Affected ICT services / functions: ${s.systemsAffected || "[systems]"}
   - ICT third-party provider involvement: ${s.ictThirdParty || "under assessment"}

2. Initial impact
   - Containment status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}
   - Customer / market impact: under assessment.
   - Cross-border impact: ${s.crossBorder === "yes" ? s.affectedMemberStates || "yes" : s.crossBorder || "under assessment"}.

3. Immediate response
   - Crisis-management procedures activated under DORA Art.17.
   - ICT-related incident management process initiated.

Intermediate and final reports will follow under Article 19(4)(b) and (c).

Contact: ${s.dpoContact || "[contact]"}`;

// CER Directive 2022/2557, Art.15 — Critical entity incident notification (24h)
export const fallbackCer = (s: FormState) => `CRITICAL ENTITY INCIDENT NOTIFICATION — CER Directive Art.15

Critical entity: ${s.controllerName || "[entity]"}
Sector: ${s.sector ? SECTOR_LABELS[s.sector] : "[sector]"}
Time of detection: ${s.discoveryTime || "[time]"}

1. Incident
   - Description: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[type]"}, affecting ${s.systemsAffected || "[essential service component]"}.
   - Containment status: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}.

2. Disruption to essential services
   - Significant disruption / potential for significant disruption: under assessment.
   - Affected user base: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "[under assessment]"}.

3. Cross-border impact
   - ${s.crossBorder === "yes" ? s.affectedMemberStates || "Yes — member states under assessment" : s.crossBorder || "Under assessment"}.

4. Mitigation
   - Resilience measures activated; coordination with national competent authority initiated.

Contact: ${s.csirtContact || s.dpoContact || "[contact]"}`;

export const internalEscalation = (s: FormState, ai?: AIAssessment | null) =>
  ai?.internal_alert || `INTERNAL ESCALATION — ${computeRiskRating(s).toUpperCase()} RISK INCIDENT

Detected: ${s.discoveryTime || "[time]"}
Type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[type]"}
Systems: ${s.systemsAffected || "[systems]"}
Approx. data subjects affected: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "[under assessment]"}

Frameworks engaged: ${[
  hasAnyPersonalData(s.dataCategories) ? "GDPR" : null,
  isNIS2Sector(s.sector) ? "NIS2" : null,
  isFinancial(s.sector) ? "DORA" : null,
  isCERSector(s.sector) && s.cerOperator ? "CER" : null,
].filter(Boolean).join(", ") || "Under assessment"}.

Active deadlines: see incident workspace.
Decision needed: senior leadership sign-off on regulatory notifications before transmission.`;
