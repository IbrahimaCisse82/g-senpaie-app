ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employe';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS auth_user_id uuid;
CREATE INDEX IF NOT EXISTS employees_auth_user_id_idx ON public.employees(auth_user_id);