CREATE TABLE public.bulletins_mois (
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
CREATE POLICY "gestion bulletins_mois" ON public.bulletins_mois FOR ALL TO authenticated
  USING (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]))
  WITH CHECK (public.is_member_any(entreprise_id, ARRAY['admin','drh','comptable']::app_role[]));
CREATE POLICY "salarie voit ses bulletins" ON public.bulletins_mois FOR SELECT TO authenticated
  USING (matricule = public.my_matricule(entreprise_id));
CREATE INDEX bulletins_mois_periode_idx ON public.bulletins_mois (entreprise_id, annee, mois);
CREATE TRIGGER bulletins_mois_updated BEFORE UPDATE ON public.bulletins_mois FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();