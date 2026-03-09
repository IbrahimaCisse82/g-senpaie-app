
CREATE TABLE public.payroll_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mois integer NOT NULL CHECK (mois >= 0 AND mois <= 11),
  annee integer NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, mois, annee)
);

ALTER TABLE public.payroll_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON public.payroll_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.payroll_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON public.payroll_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.payroll_history
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_payroll_history_updated_at
  BEFORE UPDATE ON public.payroll_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
