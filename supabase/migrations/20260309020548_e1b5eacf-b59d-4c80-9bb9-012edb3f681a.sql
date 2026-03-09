
-- Drop ALL existing RESTRICTIVE policies and recreate as PERMISSIVE

-- convention_categories
DROP POLICY IF EXISTS "Users can view own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.convention_categories;

CREATE POLICY "Users can view own categories" ON public.convention_categories FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conventions c WHERE c.id = convention_categories.convention_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own categories" ON public.convention_categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM conventions c WHERE c.id = convention_categories.convention_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can update own categories" ON public.convention_categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM conventions c WHERE c.id = convention_categories.convention_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can delete own categories" ON public.convention_categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM conventions c WHERE c.id = convention_categories.convention_id AND c.user_id = auth.uid()));

-- conventions
DROP POLICY IF EXISTS "Users can view own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can insert own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can update own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can delete own conventions" ON public.conventions;

CREATE POLICY "Users can view own conventions" ON public.conventions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conventions" ON public.conventions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conventions" ON public.conventions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conventions" ON public.conventions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- employees
DROP POLICY IF EXISTS "Users can view own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete own employees" ON public.employees;

CREATE POLICY "Users can view own employees" ON public.employees FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON public.employees FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON public.employees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- entreprises
DROP POLICY IF EXISTS "Users can view own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can insert own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can update own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can delete own entreprise" ON public.entreprises;

CREATE POLICY "Users can view own entreprise" ON public.entreprises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entreprise" ON public.entreprises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entreprise" ON public.entreprises FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entreprise" ON public.entreprises FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- payroll_history
DROP POLICY IF EXISTS "Users can view own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can insert own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can update own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can delete own history" ON public.payroll_history;

CREATE POLICY "Users can view own history" ON public.payroll_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.payroll_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.payroll_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.payroll_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- payroll_params
DROP POLICY IF EXISTS "Users can view own params" ON public.payroll_params;
DROP POLICY IF EXISTS "Users can insert own params" ON public.payroll_params;
DROP POLICY IF EXISTS "Users can update own params" ON public.payroll_params;
DROP POLICY IF EXISTS "Users can delete own params" ON public.payroll_params;

CREATE POLICY "Users can view own params" ON public.payroll_params FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own params" ON public.payroll_params FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own params" ON public.payroll_params FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own params" ON public.payroll_params FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recreate missing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_entreprises_updated_at ON public.entreprises;
CREATE TRIGGER update_entreprises_updated_at BEFORE UPDATE ON public.entreprises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conventions_updated_at ON public.conventions;
CREATE TRIGGER update_conventions_updated_at BEFORE UPDATE ON public.conventions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_params_updated_at ON public.payroll_params;
CREATE TRIGGER update_payroll_params_updated_at BEFORE UPDATE ON public.payroll_params FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_history_updated_at ON public.payroll_history;
CREATE TRIGGER update_payroll_history_updated_at BEFORE UPDATE ON public.payroll_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
