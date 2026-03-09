
-- Recreate triggers that were missing

-- Auto-create profile on new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on all tables
CREATE OR REPLACE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_entreprises_updated_at BEFORE UPDATE ON public.entreprises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payroll_params_updated_at BEFORE UPDATE ON public.payroll_params FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_conventions_updated_at BEFORE UPDATE ON public.conventions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payroll_history_updated_at BEFORE UPDATE ON public.payroll_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
