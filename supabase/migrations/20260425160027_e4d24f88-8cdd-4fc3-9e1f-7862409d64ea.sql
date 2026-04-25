
CREATE TABLE public.sub_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_incident_id UUID NOT NULL,
  raised_by_role TEXT NOT NULL DEFAULT 'lawyer',
  raised_by_name TEXT,
  recommended_action TEXT NOT NULL,
  ai_compliance_measures TEXT,
  risk_adjustment_direction TEXT NOT NULL DEFAULT 'none',
  risk_from TEXT,
  risk_to TEXT,
  legal_basis TEXT,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  tech_response TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read sub_incidents"   ON public.sub_incidents FOR SELECT USING (true);
CREATE POLICY "public can insert sub_incidents" ON public.sub_incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update sub_incidents" ON public.sub_incidents FOR UPDATE USING (true);
CREATE POLICY "public can delete sub_incidents" ON public.sub_incidents FOR DELETE USING (true);

CREATE INDEX idx_sub_incidents_parent ON public.sub_incidents(parent_incident_id);

CREATE TRIGGER update_sub_incidents_updated_at
BEFORE UPDATE ON public.sub_incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
