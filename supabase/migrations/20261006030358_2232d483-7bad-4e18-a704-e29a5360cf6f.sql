CREATE TABLE public.avances_pret (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'avance' CHECK (type IN ('avance','pret')),
  montant NUMERIC NOT NULL CHECK (montant > 0),
  date_octroi DATE NOT NULL DEFAULT CURRENT_DATE,
  nb_mensualites INTEGER NOT NULL DEFAULT 1 CHECK (nb_mensualites BETWEEN 1 AND 36),
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours','solde','annule')),
  motif TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avances_pret TO authenticated;
GRANT ALL ON public.avances_pret TO service_role;
ALTER TABLE public.avances_pret ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membres gerent avances" ON public.avances_pret FOR ALL TO authenticated USING (public.is_member_of(entreprise_id)) WITH CHECK (public.is_member_of(entreprise_id));

CREATE TABLE public.echeances_avance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avance_id UUID NOT NULL REFERENCES public.avances_pret(id) ON DELETE CASCADE,
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL,
  montant NUMERIC NOT NULL CHECK (montant > 0),
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','paye')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.echeances_avance TO authenticated;
GRANT ALL ON public.echeances_avance TO service_role;
ALTER TABLE public.echeances_avance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membres gerent echeances" ON public.echeances_avance FOR ALL TO authenticated USING (public.is_member_of(entreprise_id)) WITH CHECK (public.is_member_of(entreprise_id));

CREATE INDEX idx_avances_entreprise ON public.avances_pret(entreprise_id);
CREATE INDEX idx_echeances_avance ON public.echeances_avance(avance_id);