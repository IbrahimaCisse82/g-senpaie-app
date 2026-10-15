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