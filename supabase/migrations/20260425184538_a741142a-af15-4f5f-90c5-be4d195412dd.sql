-- New: staff_members
CREATE TABLE public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'other',
  organisation text,
  available boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read staff_members" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "public can insert staff_members" ON public.staff_members FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update staff_members" ON public.staff_members FOR UPDATE USING (true);
CREATE POLICY "public can delete staff_members" ON public.staff_members FOR DELETE USING (true);
CREATE TRIGGER trg_staff_members_updated BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New: pre_intakes
CREATE TABLE public.pre_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  reporter_title text,
  reporter_department text,
  reporter_role text,
  contact_email text,
  contact_phone text,
  self_check_1 text,
  self_check_2 text,
  self_check_3 text,
  literacy text NOT NULL DEFAULT 'non_qualified',
  story text,
  severity_classification text DEFAULT 'suspected',
  escalated boolean NOT NULL DEFAULT false,
  escalated_to_staff_id uuid,
  incident_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pre_intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read pre_intakes" ON public.pre_intakes FOR SELECT USING (true);
CREATE POLICY "public can insert pre_intakes" ON public.pre_intakes FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update pre_intakes" ON public.pre_intakes FOR UPDATE USING (true);
CREATE POLICY "public can delete pre_intakes" ON public.pre_intakes FOR DELETE USING (true);
CREATE TRIGGER trg_pre_intakes_updated BEFORE UPDATE ON public.pre_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New: incident_roles
CREATE TABLE public.incident_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL,
  staff_id uuid,
  staff_name text NOT NULL,
  staff_email text,
  role text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incident_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read incident_roles" ON public.incident_roles FOR SELECT USING (true);
CREATE POLICY "public can insert incident_roles" ON public.incident_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update incident_roles" ON public.incident_roles FOR UPDATE USING (true);
CREATE POLICY "public can delete incident_roles" ON public.incident_roles FOR DELETE USING (true);

-- Extend incidents
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS severity_classification text DEFAULT 'suspected',
  ADD COLUMN IF NOT EXISTS reporter_pre_intake_id uuid,
  ADD COLUMN IF NOT EXISTS reporter_literacy text,
  ADD COLUMN IF NOT EXISTS tech_escalation_state text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS legal_escalation_state text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS iso_reference text;

-- Extend sub_incidents
ALTER TABLE public.sub_incidents
  ADD COLUMN IF NOT EXISTS escalation_level text NOT NULL DEFAULT 'none';

-- Seed a few staff so the dropdowns aren't empty
INSERT INTO public.staff_members (name, email, role, organisation, available)
VALUES
  ('Aegis On-Call (Tech)', 'oncall.tech@example.com', 'IT', 'Internal', true),
  ('Aegis On-Call (Legal)', 'oncall.legal@example.com', 'Legal', 'Internal', true),
  ('Data Protection Officer', 'dpo@example.com', 'DPO', 'Internal', true);