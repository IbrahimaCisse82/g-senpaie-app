-- Cloisonnement : un utilisateur ne voit et ne modifie jamais les données d'une autre entreprise,
-- et ne peut pas s'attribuer lui-même un rôle. Toute anomalie lève une exception (la CI échoue).
\set ON_ERROR_STOP on
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@test'), ('bbbbbbbb-0000-4000-8000-000000000002', 'b@test'),
  ('cccccccc-0000-4000-8000-000000000003', 'c@test');

CREATE FUNCTION pg_temp.connecte(u text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('request.jwt.claim.sub', u, false); EXECUTE 'SET ROLE authenticated'; END $$;

-- A crée son entreprise et un salarié
SELECT pg_temp.connecte('aaaaaaaa-0000-4000-8000-000000000001');
INSERT INTO public.entreprises (id, user_id, nom) VALUES ('a0000000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001', 'Entreprise A');
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.entreprise_members WHERE entreprise_id = 'a0000000-0000-4000-8000-00000000000a' AND user_id = 'aaaaaaaa-0000-4000-8000-000000000001' AND role = 'admin')
  THEN RAISE EXCEPTION 'ECHEC : le créateur de l''entreprise n''est pas administrateur'; END IF;
END $$;

SELECT pg_temp.connecte('aaaaaaaa-0000-4000-8000-000000000001');
INSERT INTO public.employees (entreprise_id, user_id, matricule, prenom, nom, salaire_base, date_entree)
VALUES ('a0000000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001', 'A-001', 'Awa', 'Diop', 300000, '2020-01-01');
RESET ROLE;

-- B (autre entreprise) ne voit rien de A
SELECT pg_temp.connecte('bbbbbbbb-0000-4000-8000-000000000002');
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.employees WHERE entreprise_id = 'a0000000-0000-4000-8000-00000000000a';
  IF n <> 0 THEN RAISE EXCEPTION 'ECHEC : B lit % salarié(s) de A', n; END IF;
  SELECT count(*) INTO n FROM public.entreprises WHERE id = 'a0000000-0000-4000-8000-00000000000a';
  IF n <> 0 THEN RAISE EXCEPTION 'ECHEC : B voit l''entreprise de A'; END IF;

  UPDATE public.employees SET salaire_base = 1 WHERE entreprise_id = 'a0000000-0000-4000-8000-00000000000a';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'ECHEC : B modifie % salarié(s) de A', n; END IF;

  DELETE FROM public.employees WHERE entreprise_id = 'a0000000-0000-4000-8000-00000000000a';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'ECHEC : B supprime % salarié(s) de A', n; END IF;

  BEGIN
    INSERT INTO public.employees (entreprise_id, user_id, matricule, prenom, nom, salaire_base, date_entree)
    VALUES ('a0000000-0000-4000-8000-00000000000a', 'bbbbbbbb-0000-4000-8000-000000000002', 'B-INTRUS', 'X', 'Y', 1, '2020-01-01');
    RAISE EXCEPTION 'ECHEC : B crée un salarié chez A';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;

  BEGIN
    INSERT INTO public.entreprise_members (entreprise_id, user_id, role)
    VALUES ('a0000000-0000-4000-8000-00000000000a', 'bbbbbbbb-0000-4000-8000-000000000002', 'admin');
    RAISE EXCEPTION 'ECHEC : B s''est ajouté administrateur de A';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;
END $$;
RESET ROLE;

-- Un salarié (rôle employe) rattaché à A ne peut ni lire les autres fiches ni modifier
INSERT INTO public.entreprise_members (entreprise_id, user_id, role) VALUES ('a0000000-0000-4000-8000-00000000000a', 'cccccccc-0000-4000-8000-000000000003', 'employe');
SELECT pg_temp.connecte('cccccccc-0000-4000-8000-000000000003');
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.employees;
  IF n <> 0 THEN RAISE EXCEPTION 'ECHEC : un salarié non rattaché à une fiche lit % fiche(s)', n; END IF;
  UPDATE public.employees SET salaire_base = 1;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'ECHEC : un salarié modifie % fiche(s)', n; END IF;
END $$;
RESET ROLE;

SELECT 'ISOLATION OK' AS resultat;
