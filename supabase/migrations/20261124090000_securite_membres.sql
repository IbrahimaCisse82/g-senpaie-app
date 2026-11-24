-- Sécurité : un utilisateur ne peut plus s'ajouter lui-même comme membre d'une entreprise.
-- Avant : la politique « Self insert on accept » (WITH CHECK auth.uid() = user_id) permettait à tout
-- utilisateur connecté de s'insérer avec le rôle admin dans n'importe quelle entreprise.
-- Désormais seules les fonctions SECURITY DEFINER et la clé service (accept-invitation) créent des membres.

DROP POLICY IF EXISTS "Self insert on accept" ON public.entreprise_members;

-- Le créateur d'une entreprise en devient administrateur, sans passer par le client.
CREATE OR REPLACE FUNCTION public.ajouter_createur_membre()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.entreprise_members (entreprise_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'admin')
  ON CONFLICT (entreprise_id, user_id) DO NOTHING;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.ajouter_createur_membre() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_ajouter_createur_membre ON public.entreprises;
CREATE TRIGGER trg_ajouter_createur_membre
AFTER INSERT ON public.entreprises
FOR EACH ROW EXECUTE FUNCTION public.ajouter_createur_membre();

-- L'inscription crée déjà un membre admin : tolérer le doublon avec le trigger ci-dessus.
CREATE OR REPLACE FUNCTION public.ensure_user_entreprise()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  new_entreprise_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.entreprise_members WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.entreprises (user_id, nom)
  VALUES (NEW.user_id, 'Mon entreprise')
  RETURNING id INTO new_entreprise_id;

  INSERT INTO public.entreprise_members (entreprise_id, user_id, role)
  VALUES (new_entreprise_id, NEW.user_id, 'admin')
  ON CONFLICT (entreprise_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Rattrapage : propriétaires d'entreprise sans appartenance (ancien backfill côté client).
INSERT INTO public.entreprise_members (entreprise_id, user_id, role)
SELECT e.id, e.user_id, 'admin'::public.app_role
FROM public.entreprises e
WHERE e.user_id IS NOT NULL
ON CONFLICT (entreprise_id, user_id) DO NOTHING;
