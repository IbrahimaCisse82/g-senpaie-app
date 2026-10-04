CREATE OR REPLACE FUNCTION public.my_matricule(_entreprise_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT matricule FROM public.employees WHERE auth_user_id = auth.uid() AND entreprise_id = _entreprise_id LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.my_matricule(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_matricule(uuid) TO authenticated;

DROP POLICY IF EXISTS "Members view employees" ON public.employees;
CREATE POLICY "Staff view employees" ON public.employees FOR SELECT USING (is_member_any(entreprise_id, ARRAY['admin','drh','comptable','manager']::app_role[]));
CREATE POLICY "Employee views self" ON public.employees FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Members view conges" ON public.conges;
CREATE POLICY "Staff view conges" ON public.conges FOR SELECT USING (is_member_any(entreprise_id, ARRAY['admin','drh','comptable','manager']::app_role[]));
CREATE POLICY "Employee views own conges" ON public.conges FOR SELECT TO authenticated USING (is_member_of(entreprise_id, 'employe') AND matricule = my_matricule(entreprise_id));
CREATE POLICY "Employee requests conges" ON public.conges FOR INSERT TO authenticated WITH CHECK (is_member_of(entreprise_id, 'employe') AND matricule = my_matricule(entreprise_id) AND statut = 'demande' AND user_id = auth.uid());

DROP POLICY IF EXISTS "Members view contrats" ON public.contrats;
CREATE POLICY "Staff view contrats" ON public.contrats FOR SELECT USING (is_member_any(entreprise_id, ARRAY['admin','drh','comptable','manager']::app_role[]));
CREATE POLICY "Employee views own contrats" ON public.contrats FOR SELECT TO authenticated USING (is_member_of(entreprise_id, 'employe') AND matricule = my_matricule(entreprise_id));

DROP POLICY IF EXISTS "Members view attestations" ON public.attestations_log;
CREATE POLICY "Staff view attestations" ON public.attestations_log FOR SELECT USING (is_member_any(entreprise_id, ARRAY['admin','drh','comptable','manager']::app_role[]));

DROP POLICY IF EXISTS "Members view payroll" ON public.payroll_history;
CREATE POLICY "Staff view payroll" ON public.payroll_history FOR SELECT USING (is_member_any(entreprise_id, ARRAY['admin','drh','comptable','manager']::app_role[]));

DROP POLICY IF EXISTS "Members view coworkers" ON public.entreprise_members;
CREATE POLICY "Staff view coworkers" ON public.entreprise_members FOR SELECT USING (is_member_any(entreprise_id, ARRAY['admin','drh','comptable','manager']::app_role[]));
CREATE POLICY "Member views own membership" ON public.entreprise_members FOR SELECT TO authenticated USING (user_id = auth.uid());