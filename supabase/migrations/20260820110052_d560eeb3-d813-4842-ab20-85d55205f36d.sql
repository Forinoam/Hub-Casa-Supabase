CREATE TABLE public.payment_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  last4 text,
  color text NOT NULL DEFAULT '#8B9D83',
  closing_day integer,
  due_day integer,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_cards TO authenticated;
GRANT ALL ON public.payment_cards TO service_role;

ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage payment cards"
ON public.payment_cards FOR ALL TO authenticated
USING (public.is_home_member(home_id, auth.uid()))
WITH CHECK (public.is_home_member(home_id, auth.uid()));

CREATE TRIGGER payment_cards_updated_at BEFORE UPDATE ON public.payment_cards
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX payment_cards_home_idx ON public.payment_cards(home_id);

ALTER TABLE public.expenses
  ADD COLUMN payment_method text,
  ADD COLUMN card_id uuid REFERENCES public.payment_cards(id) ON DELETE SET NULL,
  ADD COLUMN installment_group uuid,
  ADD COLUMN installment_no integer,
  ADD COLUMN installment_total integer;

CREATE INDEX expenses_card_idx ON public.expenses(card_id);
CREATE INDEX expenses_installment_group_idx ON public.expenses(installment_group);