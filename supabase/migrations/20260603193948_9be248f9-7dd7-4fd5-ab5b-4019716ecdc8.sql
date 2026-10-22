CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_history_user_annee_mois ON public.payroll_history(user_id, annee, mois);