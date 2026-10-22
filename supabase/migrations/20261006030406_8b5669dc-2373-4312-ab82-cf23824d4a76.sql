REVOKE ALL ON public.avances_pret FROM anon;
REVOKE ALL ON public.echeances_avance FROM anon;
COMMENT ON TABLE public.avances_pret IS 'Avances et prets sur salaire - acces restreint aux membres de l entreprise';
COMMENT ON TABLE public.echeances_avance IS 'Echeanciers de remboursement - acces restreint aux membres de l entreprise';