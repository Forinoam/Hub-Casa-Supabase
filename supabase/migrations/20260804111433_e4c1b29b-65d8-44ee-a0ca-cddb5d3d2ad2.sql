ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS reminder_minutes integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

UPDATE public.events SET visibility = CASE WHEN shared THEN 'shared' ELSE 'personal' END;

ALTER TABLE public.events
  ADD CONSTRAINT events_visibility_check CHECK (visibility IN ('shared','personal')),
  ADD CONSTRAINT events_status_check CHECK (status IN ('pending','done','cancelled'));

DROP POLICY IF EXISTS "events all for home members" ON public.events;

CREATE POLICY "events select" ON public.events FOR SELECT TO authenticated
USING (private.is_home_member(home_id, auth.uid()) AND (visibility = 'shared' OR created_by = auth.uid()));

CREATE POLICY "events insert" ON public.events FOR INSERT TO authenticated
WITH CHECK (private.is_home_member(home_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "events update" ON public.events FOR UPDATE TO authenticated
USING (private.is_home_member(home_id, auth.uid()) AND (visibility = 'shared' OR created_by = auth.uid()))
WITH CHECK (private.is_home_member(home_id, auth.uid()));

CREATE POLICY "events delete" ON public.events FOR DELETE TO authenticated
USING (private.is_home_member(home_id, auth.uid()) AND (visibility = 'shared' OR created_by = auth.uid()));