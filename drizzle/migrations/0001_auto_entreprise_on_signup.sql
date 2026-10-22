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