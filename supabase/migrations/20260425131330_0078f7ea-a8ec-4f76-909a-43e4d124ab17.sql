
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discovery_time TEXT,
  incident_type TEXT,
  sector TEXT,
  jurisdiction TEXT,
  num_affected TEXT,
  risk_rating TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  fired_alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_assessment JSONB,
  lda_gdpr JSONB,
  lda_nis2 JSONB,
  lda_dora JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_incident_id ON public.audit_logs(incident_id);
CREATE INDEX idx_incidents_created_at ON public.incidents(created_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Open hackathon access
CREATE POLICY "public can read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "public can insert incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update incidents" ON public.incidents FOR UPDATE USING (true);
CREATE POLICY "public can delete incidents" ON public.incidents FOR DELETE USING (true);

CREATE POLICY "public can read audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "public can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update audit_logs" ON public.audit_logs FOR UPDATE USING (true);
CREATE POLICY "public can delete audit_logs" ON public.audit_logs FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
