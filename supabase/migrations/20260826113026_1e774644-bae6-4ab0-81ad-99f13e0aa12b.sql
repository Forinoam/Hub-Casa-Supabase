DROP POLICY IF EXISTS "Own notification preferences" ON public.notification_preferences;
CREATE POLICY "Own notification preferences"
ON public.notification_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid() AND private.is_home_member(home_id, auth.uid()))
WITH CHECK (user_id = auth.uid() AND private.is_home_member(home_id, auth.uid()));

DROP POLICY IF EXISTS "Members manage home budgets" ON public.budgets;
CREATE POLICY "Members manage home budgets"
ON public.budgets
FOR ALL
TO authenticated
USING (private.is_home_member(home_id, auth.uid()))
WITH CHECK (private.is_home_member(home_id, auth.uid()));

DROP POLICY IF EXISTS "Members manage payment cards" ON public.payment_cards;
CREATE POLICY "Members manage payment cards"
ON public.payment_cards
FOR ALL
TO authenticated
USING (private.is_home_member(home_id, auth.uid()))
WITH CHECK (private.is_home_member(home_id, auth.uid()));

REVOKE EXECUTE ON FUNCTION public.is_home_member(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_home_member(uuid, uuid) TO service_role;