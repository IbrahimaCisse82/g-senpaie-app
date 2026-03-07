
-- Use IF NOT EXISTS for triggers that may already exist
-- Skip employees trigger (already exists)

-- Check and create remaining triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_entreprises_updated_at') THEN
    CREATE TRIGGER update_entreprises_updated_at
      BEFORE UPDATE ON public.entreprises
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payroll_params_updated_at') THEN
    CREATE TRIGGER update_payroll_params_updated_at
      BEFORE UPDATE ON public.payroll_params
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Create conventions table
CREATE TABLE IF NOT EXISTS public.conventions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nom text NOT NULL,
  secteur text DEFAULT '',
  date_signature text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conventions' AND policyname = 'Users can view own conventions') THEN
    CREATE POLICY "Users can view own conventions" ON public.conventions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conventions' AND policyname = 'Users can insert own conventions') THEN
    CREATE POLICY "Users can insert own conventions" ON public.conventions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conventions' AND policyname = 'Users can update own conventions') THEN
    CREATE POLICY "Users can update own conventions" ON public.conventions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conventions' AND policyname = 'Users can delete own conventions') THEN
    CREATE POLICY "Users can delete own conventions" ON public.conventions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TRIGGER update_conventions_updated_at
  BEFORE UPDATE ON public.conventions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create convention_categories table
CREATE TABLE IF NOT EXISTS public.convention_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
  code text NOT NULL,
  libelle text NOT NULL,
  statut text DEFAULT 'employés',
  salaire_minima numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.convention_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'convention_categories' AND policyname = 'Users can view own categories') THEN
    CREATE POLICY "Users can view own categories" ON public.convention_categories FOR SELECT 
      USING (EXISTS (SELECT 1 FROM public.conventions c WHERE c.id = convention_id AND c.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'convention_categories' AND policyname = 'Users can insert own categories') THEN
    CREATE POLICY "Users can insert own categories" ON public.convention_categories FOR INSERT 
      WITH CHECK (EXISTS (SELECT 1 FROM public.conventions c WHERE c.id = convention_id AND c.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'convention_categories' AND policyname = 'Users can update own categories') THEN
    CREATE POLICY "Users can update own categories" ON public.convention_categories FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM public.conventions c WHERE c.id = convention_id AND c.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'convention_categories' AND policyname = 'Users can delete own categories') THEN
    CREATE POLICY "Users can delete own categories" ON public.convention_categories FOR DELETE 
      USING (EXISTS (SELECT 1 FROM public.conventions c WHERE c.id = convention_id AND c.user_id = auth.uid()));
  END IF;
END $$;

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload own logos') THEN
    CREATE POLICY "Users can upload own logos" ON storage.objects FOR INSERT 
      WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update own logos') THEN
    CREATE POLICY "Users can update own logos" ON storage.objects FOR UPDATE 
      USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own logos') THEN
    CREATE POLICY "Users can delete own logos" ON storage.objects FOR DELETE 
      USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view logos') THEN
    CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT 
      USING (bucket_id = 'logos');
  END IF;
END $$;
