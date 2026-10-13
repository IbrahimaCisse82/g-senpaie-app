DROP POLICY IF EXISTS "Membres gerent avances" ON public.avances_pret;
DROP POLICY IF EXISTS "Membres gerent echeances" ON public.echeances_avance;
CREATE POLICY "RH gerent avances" ON public.avances_pret FOR ALL TO authenticated
USING (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]))
WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]));
CREATE POLICY "RH gerent echeances" ON public.echeances_avance FOR ALL TO authenticated
USING (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]))
WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]));