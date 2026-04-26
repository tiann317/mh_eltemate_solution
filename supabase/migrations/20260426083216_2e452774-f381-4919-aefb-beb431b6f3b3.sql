ALTER TABLE public.pre_intakes ADD COLUMN IF NOT EXISTS responsible_staff_id uuid;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS responsible_staff_id uuid;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS responsible_staff_name text;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS responsible_staff_email text;