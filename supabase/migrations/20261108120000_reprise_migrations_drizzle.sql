-- Reprise idempotente des migrations drizzle/migrations 0000 à 0003 dans le dossier suivi par Supabase.
-- Rejouable sans erreur : la base Lovable Cloud peut déjà contenir tout ou partie de ces objets.

-- 0000 : avances et échéances réservées aux rôles RH
DROP POLICY IF EXISTS "Membres gerent avances" ON public.avances_pret;
DROP POLICY IF EXISTS "Membres gerent echeances" ON public.echeances_avance;
DROP POLICY IF EXISTS "RH gerent avances" ON public.avances_pret;
DROP POLICY IF EXISTS "RH gerent echeances" ON public.echeances_avance;
CREATE POLICY "RH gerent avances" ON public.avances_pret FOR ALL TO authenticated
USING (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]))
WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]));
CREATE POLICY "RH gerent echeances" ON public.echeances_avance FOR ALL TO authenticated
USING (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]))
WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]));

-- 0001 : entreprise créée automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.ensure_user_entreprise()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_entreprise_id uuid;
BEGIN
  -- Do nothing if the user already belongs to an entreprise (e.g. invited member)
  IF EXISTS (SELECT 1 FROM public.entreprise_members WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.entreprises (user_id, nom)
  VALUES (NEW.user_id, 'Mon entreprise')
  RETURNING id INTO new_entreprise_id;

  INSERT INTO public.entreprise_members (entreprise_id, user_id, role)
  VALUES (new_entreprise_id, NEW.user_id, 'admin');

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_profile_created_ensure_entreprise ON public.profiles;
CREATE TRIGGER on_profile_created_ensure_entreprise
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_entreprise();

-- 0002 : suppression de l'entreprise provisoire quand l'utilisateur rejoint une équipe
CREATE OR REPLACE FUNCTION public.cleanup_placeholder_entreprise()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT e.id FROM public.entreprises e
    WHERE e.user_id = NEW.user_id AND e.id <> NEW.entreprise_id AND e.nom = 'Mon entreprise'
      AND NOT EXISTS (SELECT 1 FROM public.entreprise_members m WHERE m.entreprise_id = e.id AND m.user_id <> NEW.user_id)
      AND NOT EXISTS (SELECT 1 FROM public.employees x WHERE x.entreprise_id = e.id)
      AND NOT EXISTS (SELECT 1 FROM public.payroll_history p WHERE p.entreprise_id = e.id)
  LOOP
    BEGIN
      DELETE FROM public.entreprise_members WHERE entreprise_id = r.id;
      DELETE FROM public.entreprises WHERE id = r.id;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'placeholder cleanup skipped for %: %', r.id, SQLERRM;
    END;
  END LOOP;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.cleanup_placeholder_entreprise() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_cleanup_placeholder_entreprise ON public.entreprise_members;
CREATE TRIGGER trg_cleanup_placeholder_entreprise
AFTER INSERT ON public.entreprise_members
FOR EACH ROW EXECUTE FUNCTION public.cleanup_placeholder_entreprise();

-- 0003 : bulletins figés à la clôture
CREATE TABLE IF NOT EXISTS public.bulletins_mois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  mois integer NOT NULL,
  annee integer NOT NULL,
  matricule text NOT NULL,
  nom_complet text NOT NULL,
  email text,
  brut numeric NOT NULL DEFAULT 0,
  net numeric NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  statut_envoi text NOT NULL DEFAULT 'en_attente',
  envoye_at timestamptz,
  erreur text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entreprise_id, mois, annee, matricule)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulletins_mois TO authenticated;
GRANT ALL ON public.bulletins_mois TO service_role;
ALTER TABLE public.bulletins_mois ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gestion bulletins_mois" ON public.bulletins_mois;
CREATE POLICY "gestion bulletins_mois" ON public.bulletins_mois FOR ALL TO authenticated
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]))
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]));
DROP POLICY IF EXISTS "salarie voit ses bulletins" ON public.bulletins_mois;
CREATE POLICY "salarie voit ses bulletins" ON public.bulletins_mois FOR SELECT TO authenticated
  USING (matricule = public.my_matricule(entreprise_id));
CREATE INDEX IF NOT EXISTS bulletins_mois_periode_idx ON public.bulletins_mois (entreprise_id, annee, mois);
DROP TRIGGER IF EXISTS bulletins_mois_updated ON public.bulletins_mois;
CREATE TRIGGER bulletins_mois_updated BEFORE UPDATE ON public.bulletins_mois FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
