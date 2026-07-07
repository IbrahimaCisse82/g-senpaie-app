
-- ==========================================
-- 1. NOUVELLES TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.entreprise_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'drh',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entreprise_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entreprise_members TO authenticated;
GRANT ALL ON public.entreprise_members TO service_role;
ALTER TABLE public.entreprise_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.entreprise_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'drh',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(token)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entreprise_invitations TO authenticated;
GRANT ALL ON public.entreprise_invitations TO service_role;
ALTER TABLE public.entreprise_invitations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. FONCTIONS SÉCURISÉES
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_member_of(_entreprise_id UUID, _role public.app_role DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entreprise_members
    WHERE entreprise_id = _entreprise_id
      AND user_id = auth.uid()
      AND (_role IS NULL OR role = _role)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_member_any(_entreprise_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entreprise_members
    WHERE entreprise_id = _entreprise_id
      AND user_id = auth.uid()
      AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.current_entreprise_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT entreprise_id FROM public.entreprise_members
  WHERE user_id = auth.uid()
  ORDER BY joined_at ASC LIMIT 1;
$$;

-- ==========================================
-- 3. BACKFILL : assurer une entreprise par user existant
-- ==========================================

-- Créer une entreprise pour chaque user ayant des données mais pas d'entreprise
INSERT INTO public.entreprises (user_id, nom)
SELECT DISTINCT e.user_id, 'Mon entreprise'
FROM public.employees e
WHERE NOT EXISTS (SELECT 1 FROM public.entreprises ent WHERE ent.user_id = e.user_id)
ON CONFLICT DO NOTHING;

-- Créer un membership admin pour chaque propriétaire d'entreprise
INSERT INTO public.entreprise_members (entreprise_id, user_id, role)
SELECT id, user_id, 'admin'::public.app_role
FROM public.entreprises
ON CONFLICT (entreprise_id, user_id) DO NOTHING;

-- ==========================================
-- 4. AJOUT entreprise_id SUR TABLES MÉTIER
-- ==========================================

-- Helper: pour chaque table, ajouter la colonne, backfill via user_id -> entreprise
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['employees','conges','contrats','payroll_history','payroll_params','conventions','attestations_log'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE', t);
    EXECUTE format($f$
      UPDATE public.%I tbl
      SET entreprise_id = (SELECT id FROM public.entreprises WHERE user_id = tbl.user_id LIMIT 1)
      WHERE entreprise_id IS NULL
    $f$, t);
  END LOOP;
END $$;

-- convention_categories : hériter via la convention parente
ALTER TABLE public.convention_categories ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE;
UPDATE public.convention_categories cc
SET entreprise_id = c.entreprise_id
FROM public.conventions c
WHERE cc.convention_id = c.id AND cc.entreprise_id IS NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_employees_entreprise ON public.employees(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_conges_entreprise ON public.conges(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_contrats_entreprise ON public.contrats(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_payroll_history_entreprise ON public.payroll_history(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_payroll_params_entreprise ON public.payroll_params(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_conventions_entreprise ON public.conventions(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_convention_categories_entreprise ON public.convention_categories(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_attestations_log_entreprise ON public.attestations_log(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_entreprise_members_user ON public.entreprise_members(user_id);
CREATE INDEX IF NOT EXISTS idx_entreprise_invitations_email ON public.entreprise_invitations(email);

-- ==========================================
-- 5. REFONTE RLS
-- ==========================================

-- entreprises
DROP POLICY IF EXISTS "Users can view own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can insert own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can update own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can delete own entreprise" ON public.entreprises;

CREATE POLICY "Members view entreprise" ON public.entreprises FOR SELECT
  USING (public.is_member_of(id));
CREATE POLICY "Users create their entreprise" ON public.entreprises FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update entreprise" ON public.entreprises FOR UPDATE
  USING (public.is_member_of(id, 'admin'));
CREATE POLICY "Admins delete entreprise" ON public.entreprises FOR DELETE
  USING (public.is_member_of(id, 'admin'));

-- entreprise_members
CREATE POLICY "Members view coworkers" ON public.entreprise_members FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "Admins manage members" ON public.entreprise_members FOR ALL
  USING (public.is_member_of(entreprise_id, 'admin'))
  WITH CHECK (public.is_member_of(entreprise_id, 'admin'));
CREATE POLICY "Self insert on accept" ON public.entreprise_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- entreprise_invitations
CREATE POLICY "Admins manage invitations" ON public.entreprise_invitations FOR ALL
  USING (public.is_member_of(entreprise_id, 'admin'))
  WITH CHECK (public.is_member_of(entreprise_id, 'admin'));

-- Helper macro pour tables métier
-- employees
DROP POLICY IF EXISTS "Users can view own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete own employees" ON public.employees;
CREATE POLICY "Members view employees" ON public.employees FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "DRH write employees" ON public.employees FOR INSERT
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));
CREATE POLICY "DRH update employees" ON public.employees FOR UPDATE
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));
CREATE POLICY "DRH delete employees" ON public.employees FOR DELETE
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));

-- conges
DROP POLICY IF EXISTS "users manage their own conges" ON public.conges;
CREATE POLICY "Members view conges" ON public.conges FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "DRH write conges" ON public.conges FOR INSERT
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh','manager']::public.app_role[]));
CREATE POLICY "DRH update conges" ON public.conges FOR UPDATE
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh','manager']::public.app_role[]));
CREATE POLICY "DRH delete conges" ON public.conges FOR DELETE
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));

-- contrats
DROP POLICY IF EXISTS "users manage their own contrats" ON public.contrats;
CREATE POLICY "Members view contrats" ON public.contrats FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "DRH write contrats" ON public.contrats FOR INSERT
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));
CREATE POLICY "DRH update contrats" ON public.contrats FOR UPDATE
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));
CREATE POLICY "DRH delete contrats" ON public.contrats FOR DELETE
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));

-- payroll_history
DROP POLICY IF EXISTS "Users can view own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can insert own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can update own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can delete own history" ON public.payroll_history;
CREATE POLICY "Members view payroll" ON public.payroll_history FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "DRH write payroll" ON public.payroll_history FOR INSERT
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));
CREATE POLICY "DRH update payroll" ON public.payroll_history FOR UPDATE
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));
CREATE POLICY "DRH delete payroll" ON public.payroll_history FOR DELETE
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));

-- payroll_params
DROP POLICY IF EXISTS "Users can view own params" ON public.payroll_params;
DROP POLICY IF EXISTS "Users can insert own params" ON public.payroll_params;
DROP POLICY IF EXISTS "Users can update own params" ON public.payroll_params;
DROP POLICY IF EXISTS "Users can delete own params" ON public.payroll_params;
CREATE POLICY "Members view params" ON public.payroll_params FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "Admins write params" ON public.payroll_params FOR ALL
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]))
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));

-- conventions
DROP POLICY IF EXISTS "Users can view own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can insert own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can update own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can delete own conventions" ON public.conventions;
CREATE POLICY "Members view conventions" ON public.conventions FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "Admins manage conventions" ON public.conventions FOR ALL
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]))
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));

-- convention_categories
DROP POLICY IF EXISTS "Users can view own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.convention_categories;
CREATE POLICY "Members view categories" ON public.convention_categories FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "Admins manage categories" ON public.convention_categories FOR ALL
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]))
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));

-- attestations_log
DROP POLICY IF EXISTS "users manage their own attestations_log" ON public.attestations_log;
CREATE POLICY "Members view attestations" ON public.attestations_log FOR SELECT
  USING (public.is_member_of(entreprise_id));
CREATE POLICY "DRH write attestations" ON public.attestations_log FOR INSERT
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh']::public.app_role[]));
