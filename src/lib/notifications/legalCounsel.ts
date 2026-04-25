import type { FormState } from "../domain/types";
import { DATA_CATEGORY_LABELS, DPA_MAP, INCIDENT_TYPE_LABELS, NUM_AFFECTED_LABELS, ONGOING_LABELS } from "../domain/labels";
import { computeRiskRating, hasAnyDanger, hasAnyPersonalData, isCERSector, isFinancial, isNIS2Sector } from "../domain/classify";
import type { AIAssessment } from "../ai/types";

const incidentTypeLegalAngle = (s: FormState): string => {
  switch (s.incidentType) {
    case "ransomware":
      // GDPR Art.32(1)(b)-(c), Art.33; NIS2 Art.23
      return `Ransomware / encryption attack — primary legal exposure: GDPR Art.32(1)(b)-(c) (confidentiality + restoration), Art.33 (personal-data breach where decryption key not held), and NIS2 Art.23 (significant incident). Confirm whether ransom payment is contemplated — sanctions / OFAC and Art.6 lawful basis questions arise.`;
    case "unauthorised-access":
      // GDPR Art.4(12), Art.33, Art.34, Art.32
      return `Unauthorised access / data exfiltration — primary legal exposure: GDPR Art.4(12) confidentiality breach, Art.33 + Art.34 if exfiltration confirmed, and Art.32 organisational measures review. Privilege over forensic findings should be considered now (legal-advice privilege under outside counsel instruction).`;
    case "accidental-disclosure":
      // GDPR Art.5(1)(f), Art.32, Art.33
      return `Accidental disclosure (email / misconfiguration) — primary legal exposure: GDPR Art.5(1)(f) integrity & confidentiality, Art.32 organisational measures, Art.33 notification trigger if risk to individuals not "unlikely". Recall / takedown evidence should be preserved.`;
    case "insider-threat":
      // GDPR Art.5(1)(f), Art.32(4), Art.33; StGB §§ 202a/203 (DE)
      return `Insider threat / misuse — primary legal exposure: GDPR Art.5(1)(f) and Art.32(4) staff confidentiality controls, Art.33 notification, employment-law and works-council coordination, and potential criminal complaint (StGB §§ 202a/203 in Germany).`;
    case "ot-ics":
      // NIS2 Art.23, CER Art.15, DORA Art.19
      return `OT/ICS/SCADA anomaly — primary legal exposure: NIS2 Art.23 significant incident notification, CER Art.15 if critical entity, and DORA Art.19 if financial. GDPR may not be triggered if no personal data confirmed — flag this clearly.`;
    case "lost-device":
      // GDPR Art.33, Art.32, Art.34
      return `Lost / stolen device or media — primary legal exposure: GDPR Art.33 (presumed breach unless data demonstrably inaccessible), Art.32 encryption posture, Art.34 if device unencrypted and risk high. Encryption status is dispositive for the Art.34 risk threshold.`;
    case "other":
    case "":
    default:
      // GDPR Art.4(12), Art.32, Art.33
      return `Incident classification pending — apply default analysis: GDPR Art.4(12) (any personal data?), Art.32 (security adequacy), Art.33 (72h notification clock), and any sectoral overlay (NIS2 / DORA / CER) per the controller's sector.`;
  }
};

export const internalLegalCounselDraft = (s: FormState, ai: AIAssessment | null): string => {
  const personal = hasAnyPersonalData(s.dataCategories);
  const danger = hasAnyDanger(s.dataCategories);
  const frameworks = [
    personal ? "GDPR" : null,
    isNIS2Sector(s.sector) ? "NIS2" : null,
    isFinancial(s.sector) ? "DORA" : null,
    isCERSector(s.sector) && s.cerOperator ? "CER" : null,
  ].filter(Boolean).join(", ") || "Under assessment";

  const decisions = ai?.lawyer_packet?.decisions_needed?.length
    ? ai.lawyer_packet.decisions_needed.map(d => `   • ${d}`).join("\n")
    : "   • Confirm Art.33 notification trigger\n   • Confirm Art.34 individual-notification trigger\n   • Confirm legal-privilege posture over forensic workstream";

  return `PRIVILEGED & CONFIDENTIAL — PREPARED IN CONTEMPLATION OF LEGAL ADVICE
TO:      ${s.outsideCounsel || "[Outside counsel / in-house legal]"}
FROM:    ${s.dpoContact || s.controllerName || "[DPO / Controller]"}
SUBJECT: ${computeRiskRating(s).toUpperCase()} incident — legal review request — ${s.controllerName || "[entity]"}
DATE:    ${new Date().toISOString()}

1. Incident framing
${incidentTypeLegalAngle(s)}

2. Factual snapshot
   • Discovered: ${s.discoveryTime || "[discovery time]"}
   • Type: ${s.incidentType ? INCIDENT_TYPE_LABELS[s.incidentType] : "[type]"}
   • Systems: ${s.systemsAffected || "[systems]"}
   • Containment: ${s.ongoingStatus ? ONGOING_LABELS[s.ongoingStatus] : "[status]"}
   • Data categories: ${s.dataCategories.length ? s.dataCategories.map(c => DATA_CATEGORY_LABELS[c]).join("; ") : "under investigation"}
   • Approx. data subjects: ${s.numAffected ? NUM_AFFECTED_LABELS[s.numAffected] : "under investigation"}
   • Special-category / high-risk data present: ${danger ? "YES" : "no / unknown"}
   • Cross-border: ${s.crossBorder === "yes" ? (s.affectedMemberStates || "yes — member states tbc") : (s.crossBorder || "under assessment")}
   • Jurisdiction (lead DPA): ${s.jurisdiction ? DPA_MAP[s.jurisdiction] : "[lead DPA]"}

3. Frameworks engaged
   ${frameworks}

4. Decisions required from counsel
${decisions}

5. Privilege & retention posture
   • Privilege: ${s.legalPrivilege || "not yet asserted"} ${s.outsideCounsel ? `(under instruction to ${s.outsideCounsel})` : ""}
   • Evidence/audit-log retention basis: ${s.retentionBasis || "GDPR Art.6(1)(c) + Art.33(5) — documentation of breach"}

6. Counsel handoff context
${ai?.lawyer_handoff || ai?.lawyer_packet?.incident_summary || "Awaiting AI assessment — facts above are the working record."}

7. Requested response
   Please confirm (a) the notification posture for each engaged framework, (b) whether legal-advice privilege should be formally asserted over the forensic workstream from this point forward, and (c) any external-counsel instructions you wish to issue before the next statutory deadline elapses.

— End of brief —`;
};
