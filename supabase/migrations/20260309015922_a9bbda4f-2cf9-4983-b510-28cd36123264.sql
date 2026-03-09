
-- Add missing DELETE policies for payroll_params and profiles
CREATE POLICY "Users can delete own params" ON public.payroll_params FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
