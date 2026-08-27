CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_home_member(_home_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.home_members
    WHERE home_id = _home_id
      AND user_id = _user_id
  );
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_home_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_home_member(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION private.is_home_member(uuid, uuid) FROM authenticated;

ALTER POLICY "achievements all for home members" ON public.achievements
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "ai_insights all for home members" ON public.ai_insights
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "ai_messages all for home members" ON public.ai_messages
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "categories all for home members" ON public.categories
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "events all for home members" ON public.events
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "expenses all for home members" ON public.expenses
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "home_members select same home" ON public.home_members
  USING (private.is_home_member(home_id, auth.uid()) OR user_id = auth.uid());

ALTER POLICY "homes select members" ON public.homes
  USING (private.is_home_member(id, auth.uid()) OR created_by = auth.uid());

ALTER POLICY "homes update members" ON public.homes
  USING (private.is_home_member(id, auth.uid()));

ALTER POLICY "incomes all for home members" ON public.incomes
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "inventory all for home members" ON public.inventory_items
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "maintenance all for home members" ON public.maintenance_items
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "memories all for home members" ON public.memories
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "shopping_items all for home members" ON public.shopping_items
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "task_history all for home members" ON public.task_history
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

ALTER POLICY "tasks all for home members" ON public.tasks
  USING (private.is_home_member(home_id, auth.uid()))
  WITH CHECK (private.is_home_member(home_id, auth.uid()));

REVOKE ALL ON FUNCTION public.is_home_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_home_member(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_home_member(uuid, uuid) FROM authenticated;