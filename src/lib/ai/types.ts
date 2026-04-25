export interface RecommendedAction {
  action: string;
  legal_basis: string;
  rationale: string;
}

export interface LawyerPacket {
  incident_summary: string;
  frameworks_triggered: string[];
  active_deadlines: { framework: string; deadline: string; status: string }[];
  decisions_needed: string[];
  privilege_note: string;
  open_questions: string[];
}

export interface SecurityMeasure {
  measure: string;
  legal_basis: string;
  priority: string;
  rationale: string;
}

export interface AIAssessment {
  risk_assessment: string;
  risk_rating?: string;
  key_gaps: string[];
  notification_draft: string;
  internal_alert: string;
  lawyer_handoff: string;
  recommended_actions: (RecommendedAction | string)[];
  security_playbook?: SecurityMeasure[];
  lawyer_packet?: LawyerPacket;
}

export const normalizeAction = (a: RecommendedAction | string): RecommendedAction =>
  typeof a === "string"
    ? { action: a, legal_basis: "GDPR Art.32(1)(b)", rationale: "Default: security of processing obligation." }
    : a;
