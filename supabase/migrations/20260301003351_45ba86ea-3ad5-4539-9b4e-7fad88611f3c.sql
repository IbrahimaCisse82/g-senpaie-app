
-- ══════════════════════════════════════════════════════════════
-- G-SENPAIE: Full Database Schema
-- ══════════════════════════════════════════════════════════════

-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Entreprise table
CREATE TABLE public.entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT '',
  logo TEXT DEFAULT '',
  adresse TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  ninea TEXT DEFAULT '',
  rccm TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entreprise" ON public.entreprises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entreprise" ON public.entreprises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entreprise" ON public.entreprises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entreprise" ON public.entreprises FOR DELETE USING (auth.uid() = user_id);

-- 3. Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matricule TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  sexe TEXT NOT NULL DEFAULT 'M',
  date_naissance TEXT DEFAULT '',
  lieu_naissance TEXT DEFAULT '',
  nationalite TEXT DEFAULT 'Sénégalaise',
  adresse TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  situation_famille TEXT DEFAULT 'Célibataire',
  femmes INTEGER NOT NULL DEFAULT 0,
  enfants INTEGER NOT NULL DEFAULT 0,
  fonction TEXT NOT NULL DEFAULT '',
  convention TEXT DEFAULT '',
  categorie TEXT DEFAULT '',
  statut TEXT DEFAULT 'employés',
  contrat TEXT DEFAULT 'CDI',
  date_entree TEXT NOT NULL,
  salaire_base NUMERIC NOT NULL DEFAULT 0,
  sursalaire NUMERIC NOT NULL DEFAULT 0,
  -- Gestion avancée
  heures_absence NUMERIC NOT NULL DEFAULT 0,
  heures_abs_maladie NUMERIC NOT NULL DEFAULT 0,
  taux_maladie NUMERIC NOT NULL DEFAULT 0,
  nb_paniers NUMERIC NOT NULL DEFAULT 0,
  hs115 NUMERIC NOT NULL DEFAULT 0,
  hs140 NUMERIC NOT NULL DEFAULT 0,
  hs160 NUMERIC NOT NULL DEFAULT 0,
  hs200 NUMERIC NOT NULL DEFAULT 0,
  avance_tabaski NUMERIC NOT NULL DEFAULT 0,
  avance_caisse NUMERIC NOT NULL DEFAULT 0,
  avance_financiere NUMERIC NOT NULL DEFAULT 0,
  ret_cooperative NUMERIC NOT NULL DEFAULT 0,
  frais_medicaux NUMERIC NOT NULL DEFAULT 0,
  ind_kilometrique NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, matricule)
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employees" ON public.employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own employees" ON public.employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON public.employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON public.employees FOR DELETE USING (auth.uid() = user_id);

-- 4. Payroll parameters table
CREATE TABLE public.payroll_params (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own params" ON public.payroll_params FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own params" ON public.payroll_params FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own params" ON public.payroll_params FOR UPDATE USING (auth.uid() = user_id);

-- 5. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_entreprises_updated_at BEFORE UPDATE ON public.entreprises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_params_updated_at BEFORE UPDATE ON public.payroll_params FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
