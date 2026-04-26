-- Track action completions for audit feedback
CREATE TABLE public.action_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL,
  action_key TEXT NOT NULL,             -- stable identifier for the action (e.g. "rec:0", "playbook:1", "deadline:gdpr-art33")
  action_label TEXT NOT NULL,
  legal_basis TEXT,
  completed_by TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_action_completions_incident ON public.action_completions(incident_id);
ALTER TABLE public.action_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read action_completions" ON public.action_completions FOR SELECT USING (true);
CREATE POLICY "public can insert action_completions" ON public.action_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update action_completions" ON public.action_completions FOR UPDATE USING (true);
CREATE POLICY "public can delete action_completions" ON public.action_completions FOR DELETE USING (true);

-- Track oversight requests for additional lawyer / DPO review on a specific action
CREATE TABLE public.oversight_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL,
  action_key TEXT NOT NULL,
  action_label TEXT NOT NULL,
  reviewer_role TEXT NOT NULL DEFAULT 'lawyer',  -- lawyer | dpo | ciso | external-counsel
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',         -- pending | acknowledged | resolved
  requested_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_oversight_requests_incident ON public.oversight_requests(incident_id);
ALTER TABLE public.oversight_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read oversight_requests" ON public.oversight_requests FOR SELECT USING (true);
CREATE POLICY "public can insert oversight_requests" ON public.oversight_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update oversight_requests" ON public.oversight_requests FOR UPDATE USING (true);
CREATE POLICY "public can delete oversight_requests" ON public.oversight_requests FOR DELETE USING (true);

CREATE TRIGGER update_oversight_requests_updated_at
BEFORE UPDATE ON public.oversight_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();