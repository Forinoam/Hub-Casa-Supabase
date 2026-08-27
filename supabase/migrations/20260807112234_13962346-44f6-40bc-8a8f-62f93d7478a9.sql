-- 1. Prioridade padronizada: high | medium | low | none
UPDATE public.tasks SET priority = 'medium' WHERE priority = 'normal';
UPDATE public.shopping_items SET priority = 'medium' WHERE priority = 'normal';
UPDATE public.tasks SET priority = 'none' WHERE priority NOT IN ('high','medium','low','none');
UPDATE public.shopping_items SET priority = 'none' WHERE priority NOT IN ('high','medium','low','none');

ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT 'none';
ALTER TABLE public.shopping_items ALTER COLUMN priority SET DEFAULT 'none';

ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('high','medium','low','none'));
ALTER TABLE public.shopping_items ADD CONSTRAINT shopping_items_priority_check CHECK (priority IN ('high','medium','low','none'));

-- 2. Compromissos: prioridade + recorrência
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'none';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence text;
ALTER TABLE public.events ADD CONSTRAINT events_priority_check CHECK (priority IN ('high','medium','low','none'));

-- 3. Financeiro: separar contas (bill) de gastos (spend) e permitir valor desconhecido
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'bill';
ALTER TABLE public.expenses ADD CONSTRAINT expenses_kind_check CHECK (kind IN ('bill','spend'));
ALTER TABLE public.expenses ALTER COLUMN amount DROP NOT NULL;

-- 4. Categorias financeiras mais completas
CREATE OR REPLACE FUNCTION public.seed_default_categories(_home_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    ('Moradia','#8B9D83','expenses'),
    ('Alimentação','#C97B5C','expenses'),
    ('Transporte','#D4A574','expenses'),
    ('Saúde','#7A9E7E','expenses'),
    ('Lazer','#B57560','expenses'),
    ('Assinaturas','#5F7A8B','expenses'),
    ('Impostos','#A87B94','expenses'),
    ('Energia','#8B9D83','expenses'),
    ('Água','#5F7A8B','expenses'),
    ('Internet','#C97B5C','expenses'),
    ('Mercado','#D4A574','expenses'),
    ('Pets','#B57560','expenses'),
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
$function$;

-- Aplica as novas categorias às casas já existentes
DO $$
DECLARE h uuid;
BEGIN
  FOR h IN SELECT id FROM public.homes LOOP
    PERFORM public.seed_default_categories(h);
  END LOOP;
END $$;