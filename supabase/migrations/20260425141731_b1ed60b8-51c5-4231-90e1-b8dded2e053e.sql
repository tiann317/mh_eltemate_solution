-- Notifications drafted/sent per incident
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,           -- 'gdpr-art33', 'gdpr-art34', 'nis2-early-warning', 'nis2-72h', 'dora-initial', 'cer-art15', 'internal-escalation'
  authority TEXT,                    -- e.g. 'CNIL', 'BSI', 'BaFin'
  recipient_email TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'sent' | 'acknowledged'
  sent_at TIMESTAMPTZ,
  sent_by TEXT,
  delivery_method TEXT,              -- 'email' | 'portal' | 'manual' | 'download'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "public can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "public can delete notifications" ON public.notifications FOR DELETE USING (true);

CREATE INDEX idx_notifications_incident ON public.notifications(incident_id);

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Cached count of outstanding actions per incident (for dashboard list)
ALTER TABLE public.incidents ADD COLUMN outstanding_actions_count INTEGER NOT NULL DEFAULT 0;