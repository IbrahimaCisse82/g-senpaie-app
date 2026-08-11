-- 1. Révoquer tout accès anonyme aux tables applicatives
REVOKE ALL ON public.employees, public.entreprises, public.entreprise_members,
  public.entreprise_invitations, public.payroll_history, public.payroll_params,
  public.conventions, public.convention_categories, public.conges, public.contrats,
  public.attestations_log, public.profiles, public.user_roles
FROM anon;

-- 2. Révoquer l'exécution publique/anonyme des fonctions de sécurité
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_member_of(uuid, app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_member_any(uuid, app_role[]) FROM anon, public;
REVOKE ALL ON FUNCTION public.current_entreprise_id() FROM anon, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, public;

-- 3. Réattribuer aux rôles légitimes
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_of(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_any(uuid, app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_entreprise_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

-- 4. S'assurer que les utilisateurs connectés gardent bien leurs droits
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees, public.entreprises,
  public.entreprise_members, public.entreprise_invitations, public.payroll_history,
  public.payroll_params, public.conventions, public.convention_categories,
  public.conges, public.contrats, public.attestations_log, public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.employees, public.entreprises, public.entreprise_members,
  public.entreprise_invitations, public.payroll_history, public.payroll_params,
  public.conventions, public.convention_categories, public.conges, public.contrats,
  public.attestations_log, public.profiles, public.user_roles TO service_role;