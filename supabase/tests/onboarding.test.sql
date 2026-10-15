-- Onboarding tests: signup creates an entreprise; invitation attaches user to inviting entreprise.
-- Everything runs inside a transaction and is rolled back (no data left behind).
BEGIN;
DO $$
DECLARE
  owner_id uuid := gen_random_uuid();
  invited_id uuid := gen_random_uuid();
  ent_owner uuid; n int; ent_invited uuid;
BEGIN
  -- 1. New signup -> profile -> entreprise + admin membership
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  VALUES (owner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'test-owner-' || owner_id || '@example.test', '{}'::jsonb, now(), now());
  SELECT count(*) INTO n FROM public.entreprise_members WHERE user_id = owner_id AND role = 'admin';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL signup: expected 1 admin membership, got %', n; END IF;
  SELECT entreprise_id INTO ent_owner FROM public.entreprise_members WHERE user_id = owner_id;
  IF NOT EXISTS (SELECT 1 FROM public.entreprises WHERE id = ent_owner AND user_id = owner_id) THEN
    RAISE EXCEPTION 'FAIL signup: entreprise not created'; END IF;

  -- 2. Invited user signs up (gets placeholder), then accepts invitation
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  VALUES (invited_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'test-invited-' || invited_id || '@example.test', '{}'::jsonb, now(), now());
  INSERT INTO public.entreprise_members (entreprise_id, user_id, role) VALUES (ent_owner, invited_id, 'comptable');

  SELECT count(*) INTO n FROM public.entreprise_members WHERE user_id = invited_id;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL invitation: expected 1 membership, got %', n; END IF;
  SELECT entreprise_id INTO ent_invited FROM public.entreprise_members WHERE user_id = invited_id;
  IF ent_invited <> ent_owner THEN RAISE EXCEPTION 'FAIL invitation: attached to wrong entreprise'; END IF;
  IF EXISTS (SELECT 1 FROM public.entreprises WHERE user_id = invited_id) THEN
    RAISE EXCEPTION 'FAIL invitation: placeholder entreprise not removed'; END IF;

  RAISE NOTICE 'ALL ONBOARDING TESTS PASSED';
END $$;
ROLLBACK;
