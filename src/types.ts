export type Incident = {
  id: string;
  title: string;
  summary: string | null;
  risk_rating: string | null;
  payload: Record<string, unknown> | null;
  assessment: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type AssessSource = {
  content: string;
  metadata: Record<string, unknown>;
};

export type Assessment = {
  answer: string;
  sources: AssessSource[];
  response_id: string | null;
};

export type Notification = {
  id: string;
  incident_id: string;
  framework: string;
  authority: string | null;
  recipient_email: string | null;
  subject: string;
  body: string;
  status: string;
  sent_at: string | null;
  sent_by: string | null;
  delivery_method: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  incident_id: string;
  message: string;
  created_at: string;
};
