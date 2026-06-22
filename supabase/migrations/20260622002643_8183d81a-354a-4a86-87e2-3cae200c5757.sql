
-- ═══════════════════════════════════════════════════════════════════
-- Sprint 2-5: Tables RH complètes
-- ═══════════════════════════════════════════════════════════════════

-- Sprint 3: champs sortie sur employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS date_sortie DATE,
  ADD COLUMN IF NOT EXISTS motif_sortie TEXT;

-- Sprint 2: champ jours_absence sur payroll_history
ALTER TABLE public.payroll_history
  ADD COLUMN IF NOT EXISTS jours_absence NUMERIC DEFAULT 0;

-- ═══ Sprint 2: Congés ═══
CREATE TABLE IF NOT EXISTS public.conges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matricule TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'paye',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  jours NUMERIC NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'demande',
  motif TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conges TO authenticated;
GRANT ALL ON public.conges TO service_role;
ALTER TABLE public.conges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage their own conges" ON public.conges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_conges_user_mat ON public.conges(user_id, matricule);
CREATE TRIGGER trg_conges_updated BEFORE UPDATE ON public.conges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══ Sprint 4: Contrats ═══
CREATE TABLE IF NOT EXISTS public.contrats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matricule TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'CDI',
  date_debut DATE NOT NULL,
  date_fin DATE,
  periode_essai_mois INTEGER DEFAULT 3,
  lieu_travail TEXT DEFAULT '',
  remuneration NUMERIC DEFAULT 0,
  clauses_particulieres TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrats TO authenticated;
GRANT ALL ON public.contrats TO service_role;
ALTER TABLE public.contrats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage their own contrats" ON public.contrats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_contrats_user_mat ON public.contrats(user_id, matricule);
CREATE TRIGGER trg_contrats_updated BEFORE UPDATE ON public.contrats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══ Sprint 3: Audit attestations ═══
CREATE TABLE IF NOT EXISTS public.attestations_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matricule TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.attestations_log TO authenticated;
GRANT ALL ON public.attestations_log TO service_role;
ALTER TABLE public.attestations_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage their own attestations_log" ON public.attestations_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══ Sprint 5: Rôles utilisateurs ═══
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'drh', 'comptable', 'manager');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
