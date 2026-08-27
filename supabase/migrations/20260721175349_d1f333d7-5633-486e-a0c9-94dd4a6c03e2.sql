
-- Fix missing GRANTs on all public tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Profiles readable by anon-less; keep as-is but ensure authenticated can read
GRANT SELECT ON public.profiles TO authenticated;

-- New: custom categories per home
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B9D83',
  icon TEXT NOT NULL DEFAULT 'Tag',
  module TEXT NOT NULL DEFAULT 'tasks',
  default_points INT DEFAULT 10,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories all for home members"
  ON public.categories FOR ALL
  USING (public.is_home_member(home_id, auth.uid()))
  WITH CHECK (public.is_home_member(home_id, auth.uid()));

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Extend events with owner (individual/shared)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS shared BOOLEAN NOT NULL DEFAULT true;

-- Recurring expenses support
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS recurrence TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Household income
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  recurrence TEXT NOT NULL DEFAULT 'monthly',
  received_on DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.incomes TO authenticated;
GRANT ALL ON public.incomes TO service_role;

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incomes all for home members"
  ON public.incomes FOR ALL
  USING (public.is_home_member(home_id, auth.uid()))
  WITH CHECK (public.is_home_member(home_id, auth.uid()));

CREATE TRIGGER incomes_updated_at BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
