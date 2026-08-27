-- 1. Remover módulo de estoque
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DELETE FROM public.categories WHERE module = 'inventory';

-- 2. Evitar duplicidade de categorias
CREATE UNIQUE INDEX IF NOT EXISTS categories_home_module_name_key
  ON public.categories (home_id, module, lower(name));

-- 3. Função de seed de categorias padrão
CREATE OR REPLACE FUNCTION public.seed_default_categories(_home_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (home_id, name, color, icon, module)
  SELECT _home_id, d.name, d.color, 'tag', d.module
  FROM (VALUES
    ('Cozinha','#8B9D83','tasks'),
    ('Banheiro','#C97B5C','tasks'),
    ('Lavanderia','#D4A574','tasks'),
    ('Sala','#7A9E7E','tasks'),
    ('Quarto','#B57560','tasks'),
    ('Pets','#5F7A8B','tasks'),
    ('Jardim','#A87B94','tasks'),
    ('Organização','#8B9D83','tasks'),
    ('Manutenção','#C97B5C','tasks'),
    ('Outros','#D4A574','tasks'),
    ('Mercado','#8B9D83','shopping'),
    ('Farmácia','#C97B5C','shopping'),
    ('Casa','#D4A574','shopping'),
    ('Pets','#7A9E7E','shopping'),
    ('Outros','#B57560','shopping'),
    ('Energia','#8B9D83','expenses'),
    ('Água','#5F7A8B','expenses'),
    ('Internet','#C97B5C','expenses'),
    ('Mercado','#D4A574','expenses'),
    ('Moradia','#7A9E7E','expenses'),
    ('Pets','#B57560','expenses'),
    ('Transporte','#A87B94','expenses'),
    ('Streaming','#8B9D83','expenses'),
    ('Seguro','#5F7A8B','expenses'),
    ('Outros','#C97B5C','expenses'),
    ('Elétrica','#8B9D83','maintenance'),
    ('Hidráulica','#5F7A8B','maintenance'),
    ('Eletrodomésticos','#C97B5C','maintenance'),
    ('Ar-condicionado','#7A9E7E','maintenance'),
    ('Veículos','#D4A574','maintenance'),
    ('Outros','#B57560','maintenance')
  ) AS d(name, color, module)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_default_categories(uuid) TO authenticated, service_role;

-- 4. Backfill: casas sem categorias
DO $$
DECLARE h record;
BEGIN
  FOR h IN SELECT id FROM public.homes LOOP
    PERFORM public.seed_default_categories(h.id);
  END LOOP;
END $$;

-- 5. Novas casas nascem com categorias padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_home_id UUID;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.homes (name, created_by) VALUES ('Minha casa', NEW.id) RETURNING id INTO new_home_id;
  INSERT INTO public.home_members (home_id, user_id, role) VALUES (new_home_id, NEW.id, 'owner');
  PERFORM public.seed_default_categories(new_home_id);
  RETURN NEW;
END;
$$;