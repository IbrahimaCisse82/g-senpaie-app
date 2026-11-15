-- Gratification / 13e mois et régularisation annuelle de l'IR : éléments variables du mois, remis à zéro à la clôture.
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS gratification numeric NOT NULL DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS regul_ir numeric NOT NULL DEFAULT 0;
