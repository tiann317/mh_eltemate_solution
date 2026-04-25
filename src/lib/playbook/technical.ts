import type { FormState } from "../domain/types";

export interface TechnicalActionItem {
  action: string;
  legal_basis: string;
  rationale: string;
}

// GDPR Art.33(5), Art.5(2); ISO/IEC 27035, 27037, 27001 A.5.24, A.8.15, A.5.5
export const GENERAL_AUDITABILITY_ACTIONS: TechnicalActionItem[] = [
  {
    action: "Open a dedicated incident ticket and start a contemporaneous timeline (UTC, append-only).",
    legal_basis: "GDPR Art.33(5) · ISO/IEC 27035-2 §6.4",
    rationale: "Art.33(5) requires the controller to document any breach (facts, effects, remedial action) — a written timeline is the minimum evidence.",
  },
  {
    action: "Preserve volatile evidence (RAM, network state, active sessions) before any remediation that would alter it.",
    legal_basis: "ISO/IEC 27037 §5.3 · GDPR Art.5(2) accountability",
    rationale: "Forensic admissibility requires capturing volatile data first; remediation steps that overwrite it must be deferred or hashed beforehand.",
  },
  {
    action: "Hash and chain-of-custody all collected logs, snapshots and disk images (SHA-256, signed manifest).",
    legal_basis: "ISO/IEC 27037 §6.7 (chain of custody)",
    rationale: "Without a documented chain of custody, evidence may be inadmissible in regulatory or civil proceedings.",
  },
  {
    action: "Lock log-rotation / retention on all in-scope systems for the duration of the incident.",
    legal_basis: "GDPR Art.5(1)(e) + Art.6(1)(c) · ISO/IEC 27001 A.8.15",
    rationale: "Default retention windows can destroy evidence within hours — pause rotation under a documented lawful basis.",
  },
  {
    action: "Restrict the responder Slack/Teams channel and instruct participants that comms may be discoverable; route legal analysis through counsel.",
    legal_basis: "Legal-advice privilege · GDPR Art.6(1)(f) legitimate interest",
    rationale: "Loose responder chatter often becomes the single most damaging exhibit in a regulatory investigation.",
  },
  {
    action: "Notify the DPO and information-security manager in writing within 1 hour of detection.",
    legal_basis: "GDPR Art.38(1) · ISO/IEC 27001 A.5.24",
    rationale: "The DPO must be 'involved, properly and in a timely manner' in all data-protection issues — late notification is itself a finding.",
  },
];

export function getIncidentTypeTechnicalActions(s: FormState): TechnicalActionItem[] {
  switch (s.incidentType) {
    case "ransomware":
      return [
        { action: "Isolate affected hosts at the network layer (do NOT power off — preserves RAM for forensics).", legal_basis: "GDPR Art.32(1)(b) · ISO/IEC 27035 §7.3", rationale: "Containment without losing volatile evidence is the standard for ransomware response." },
        { action: "Capture a sample of the ransom note, encrypted file headers and any C2 indicators; do NOT engage the attacker.", legal_basis: "ISO/IEC 27037 §6 · EU sanctions regime", rationale: "Communicating with the attacker may breach EU/OFAC sanctions and prejudice law-enforcement cooperation." },
        { action: `Confirm backup integrity${s.backupsAvailable === "yes" ? " (backups reported available — verify they are offline / immutable and uninfected before restore)" : " — backups not yet confirmed; treat restore as untrusted"}.`, legal_basis: "GDPR Art.32(1)(c) · NIS2 Art.21(2)(d)", rationale: "Restoration capability is an explicit Art.32(1)(c) requirement; restoring from a compromised backup re-infects the estate." },
        { action: "Engage law enforcement (national cybercrime unit) before any decision on ransom payment.", legal_basis: "NIS2 Art.23(1) · national criminal-procedure law", rationale: "Most EU member states require or strongly encourage law-enforcement involvement; payment without engagement carries criminal exposure." },
      ];
    case "unauthorised-access":
      return [
        { action: "Force credential rotation for all identities with access to the affected systems (including service accounts and API keys).", legal_basis: "GDPR Art.32(1)(b) · ISO/IEC 27001 A.5.16", rationale: "Stolen credentials are the most common reuse vector; rotate before scoping is complete." },
        { action: `Determine whether data exfiltration is confirmed${s.exfiltrationConfirmed ? ` (current status: ${s.exfiltrationConfirmed})` : ""} — review egress logs, DLP alerts and cloud audit trails.`, legal_basis: "GDPR Art.33(1) (risk threshold) · Art.34(1)", rationale: "Confirmed exfiltration shifts the Art.34 individual-notification analysis to a near-mandatory posture." },
        { action: "Snapshot affected hosts and capture full packet capture at the egress edge for the relevant window.", legal_basis: "ISO/IEC 27037 §5.3", rationale: "Without packet/egress evidence the scope of exfiltration cannot be defended in a regulatory investigation." },
        { action: "Revoke active sessions (SSO, VPN, OAuth tokens) for the affected user population.", legal_basis: "GDPR Art.32(1)(b) · ISO/IEC 27001 A.8.5", rationale: "Token-based persistence frequently survives a password reset; revocation is required to terminate the intrusion." },
      ];
    case "accidental-disclosure":
      return [
        { action: "Issue immediate recall / takedown requests (email recall, public-share revocation, search-engine de-indexing where applicable).", legal_basis: "GDPR Art.5(1)(f) · Art.32(1)(b)", rationale: "Mitigating exposure narrows the Art.34 risk assessment and is required as a 'measure to address the breach'." },
        { action: "Preserve message metadata, recipient list and read-receipts before deleting any copies under your control.", legal_basis: "GDPR Art.33(5) · ISO/IEC 27037", rationale: "You must be able to prove who saw what, when — deletion before preservation destroys the only evidence." },
        { action: "Contact downstream recipients in writing instructing deletion and seeking confirmation.", legal_basis: "GDPR Art.5(1)(f) integrity & confidentiality", rationale: "A documented deletion request from each recipient is the strongest mitigation evidence available." },
        { action: "Review the misconfiguration / process that caused disclosure and freeze the underlying change pipeline pending root-cause.", legal_basis: "GDPR Art.32(1)(d) · ISO/IEC 27001 A.8.32", rationale: "Recurrence within 72h would aggravate the regulator's view of the controller's Art.32 posture." },
      ];
    case "insider-threat":
      return [
        { action: "Suspend the suspected individual's access (logical and physical) without alerting them, in coordination with HR / works council.", legal_basis: "GDPR Art.32(4) · national employment law", rationale: "Tipping off a malicious insider destroys evidence; suspension must be documented and coordinated with employment counsel." },
        { action: "Preserve endpoint, mailbox and DLP records for the suspected user under legal hold.", legal_basis: "ISO/IEC 27037 · GDPR Art.5(2)", rationale: "Endpoint data on a current employee is sensitive — process it under a documented legal hold and lawful basis." },
        { action: "Prepare a criminal-complaint package in parallel with the regulatory workstream (e.g. StGB §§ 202a/203 in Germany).", legal_basis: "National criminal-procedure law · GDPR Art.6(1)(c)/(f)", rationale: "Filing a criminal complaint protects the controller's position and may affect privilege over the forensic workstream." },
        { action: "Restrict communication about the matter to a named investigation team; everyone else 'need to know' only.", legal_basis: "Confidentiality / legal-advice privilege", rationale: "Insider-threat investigations are the highest-risk surface for premature disclosure and defamation claims." },
      ];
    case "ot-ics":
      return [
        { action: "Coordinate any containment action with the OT/ICS engineering team — do NOT apply IT-style isolation without safety review.", legal_basis: "NIS2 Art.21(2) · IEC 62443-3-3", rationale: "An IT-style network cut on an OT segment can cause physical-process safety incidents." },
        { action: "Capture historian, PLC and HMI logs to immutable storage before any reset.", legal_basis: "ISO/IEC 27037 · IEC 62443-2-1", rationale: "OT logs roll over rapidly and are the only artefact of process-side anomalies." },
        { action: "Notify the national CSIRT under NIS2 Art.23(4)(a) within 24h of awareness.", legal_basis: "NIS2 Art.23(4)(a)", rationale: "OT incidents at essential / important entities are the prototypical NIS2 early-warning trigger." },
        { action: "Confirm whether any personal data was incidentally affected (engineering-station mailboxes, RDP accounts) — if yes, the GDPR track engages in addition.", legal_basis: "GDPR Art.4(12)", rationale: "OT incidents often have a hidden GDPR overlay through engineering workstations." },
      ];
    case "lost-device":
      return [
        { action: `Confirm device-encryption status and key-management posture${s.deviceEncrypted ? ` (current status: ${s.deviceEncrypted})` : ""}.`, legal_basis: "GDPR Art.32(1)(a) · Art.34(3)(a)", rationale: "Strong encryption with the key not exposed is the dispositive factor that can disapply Art.34 individual notification." },
        { action: "Trigger remote wipe / token revocation for the device's identity and any cached credentials.", legal_basis: "GDPR Art.32(1)(b) · ISO/IEC 27001 A.7.9", rationale: "Even an encrypted device with cached app sessions can leak data if the session tokens are not revoked." },
        { action: "File a police report and preserve the report number for the regulator and insurer.", legal_basis: "Insurance condition · GDPR Art.33(5) documentation", rationale: "Cyber-insurance and most DPAs expect a police-report reference for stolen-device cases." },
        { action: "Inventory exactly what data and which accounts were resident on the device (MDM extract, last-sync logs).", legal_basis: "GDPR Art.30 records · Art.33(3)(a)", rationale: "Art.33(3)(a) requires you to describe categories and approximate numbers of data subjects affected — MDM records are the fastest source." },
      ];
    case "other":
    case "":
    default:
      return [
        { action: "Classify the incident type as quickly as possible — the playbook below changes materially per type.", legal_basis: "GDPR Art.33(1) · ISO/IEC 27035-1 §5", rationale: "The 72h Art.33 clock runs from awareness, not from classification — delay in classifying does not pause the clock." },
        { action: "Apply the GENERAL audit-readiness measures (left column) without waiting for classification.", legal_basis: "GDPR Art.5(2) accountability", rationale: "Evidence preservation and DPO notification are the same regardless of incident type." },
      ];
  }
}
