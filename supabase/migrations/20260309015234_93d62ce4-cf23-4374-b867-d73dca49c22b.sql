
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for all tables

-- ═══ employees ═══
DROP POLICY IF EXISTS "Users can view own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete own employees" ON public.employees;

CREATE POLICY "Users can view own employees" ON public.employees FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON public.employees FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON public.employees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ═══ entreprises ═══
DROP POLICY IF EXISTS "Users can view own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can insert own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can update own entreprise" ON public.entreprises;
DROP POLICY IF EXISTS "Users can delete own entreprise" ON public.entreprises;

CREATE POLICY "Users can view own entreprise" ON public.entreprises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entreprise" ON public.entreprises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entreprise" ON public.entreprises FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entreprise" ON public.entreprises FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ═══ payroll_params ═══
DROP POLICY IF EXISTS "Users can view own params" ON public.payroll_params;
DROP POLICY IF EXISTS "Users can insert own params" ON public.payroll_params;
DROP POLICY IF EXISTS "Users can update own params" ON public.payroll_params;

CREATE POLICY "Users can view own params" ON public.payroll_params FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own params" ON public.payroll_params FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own params" ON public.payroll_params FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ═══ conventions ═══
DROP POLICY IF EXISTS "Users can view own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can insert own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can update own conventions" ON public.conventions;
DROP POLICY IF EXISTS "Users can delete own conventions" ON public.conventions;

CREATE POLICY "Users can view own conventions" ON public.conventions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conventions" ON public.conventions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conventions" ON public.conventions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conventions" ON public.conventions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ═══ convention_categories ═══
DROP POLICY IF EXISTS "Users can view own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.convention_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.convention_categories;

CREATE POLICY "Users can view own categories" ON public.convention_categories FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conventions c WHERE c.id = convention_categories.convention_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own categories" ON public.convention_categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM conventions c WHERE c.id = convention_categories.convention_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can update own categories" ON public.convention_categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM conventions c WHERE c.id = convention_categories.convention_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can delete own categories" ON public.convention_categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM conventions c WHERE c.id = convention_categories.convention_id AND c.user_id = auth.uid()));

-- ═══ payroll_history ═══
DROP POLICY IF EXISTS "Users can view own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can insert own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can update own history" ON public.payroll_history;
DROP POLICY IF EXISTS "Users can delete own history" ON public.payroll_history;

CREATE POLICY "Users can view own history" ON public.payroll_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.payroll_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.payroll_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.payroll_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ═══ profiles ═══
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
