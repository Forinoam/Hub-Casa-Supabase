-- 1. Homes: settings + updated_at
ALTER TABLE public.homes
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS homes_updated_at ON public.homes;
CREATE TRIGGER homes_updated_at BEFORE UPDATE ON public.homes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Profiles: active home
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_home_id uuid REFERENCES public.homes(id) ON DELETE SET NULL;

-- 3. Roles normalization
UPDATE public.home_members SET role = 'owner' WHERE role NOT IN ('owner','admin','member');

-- 4. Admin helper (security definer, private schema)
CREATE OR REPLACE FUNCTION private.is_home_admin(_home_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.home_members
    WHERE home_id = _home_id AND user_id = _user_id AND role IN ('owner','admin')
  );
$$;
GRANT EXECUTE ON FUNCTION private.is_home_admin(uuid, uuid) TO authenticated, service_role;

-- 5. Member management policies
DROP POLICY IF EXISTS "home_members update admin" ON public.home_members;
CREATE POLICY "home_members update admin" ON public.home_members
  FOR UPDATE TO authenticated
  USING (private.is_home_admin(home_id, auth.uid()))
  WITH CHECK (private.is_home_admin(home_id, auth.uid()));

DROP POLICY IF EXISTS "home_members delete self or owner" ON public.home_members;
CREATE POLICY "home_members delete self or admin" ON public.home_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR private.is_home_admin(home_id, auth.uid()));

DROP POLICY IF EXISTS "homes update members" ON public.homes;
CREATE POLICY "homes update admins" ON public.homes
  FOR UPDATE TO authenticated
  USING (private.is_home_admin(id, auth.uid()) OR created_by = auth.uid())
  WITH CHECK (private.is_home_admin(id, auth.uid()) OR created_by = auth.uid());

-- 6. Invites
CREATE TABLE IF NOT EXISTS public.home_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 8)),
  role text NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_invites TO authenticated;
GRANT ALL ON public.home_invites TO service_role;

ALTER TABLE public.home_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invites admin manage" ON public.home_invites;
CREATE POLICY "invites admin manage" ON public.home_invites
  FOR ALL TO authenticated
  USING (private.is_home_admin(home_id, auth.uid()))
  WITH CHECK (private.is_home_admin(home_id, auth.uid()) AND invited_by = auth.uid());

DROP POLICY IF EXISTS "invites invitee select" ON public.home_invites;
CREATE POLICY "invites invitee select" ON public.home_invites
  FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE INDEX IF NOT EXISTS home_invites_home_idx ON public.home_invites (home_id);
CREATE INDEX IF NOT EXISTS home_invites_email_idx ON public.home_invites (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS home_invites_pending_unique
  ON public.home_invites (home_id, lower(email)) WHERE status = 'pending';

-- 7. Accept invite RPC
CREATE OR REPLACE FUNCTION public.accept_home_invite(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.home_invites%ROWTYPE;
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Faça login para aceitar o convite.';
  END IF;

  SELECT * INTO v_invite FROM public.home_invites
   WHERE upper(code) = upper(trim(_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite não encontrado.';
  END IF;
  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'Este convite já foi utilizado ou cancelado.';
  END IF;
  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Este convite expirou.';
  END IF;
  IF lower(v_invite.email) <> v_email THEN
    RAISE EXCEPTION 'Este convite foi enviado para outro e-mail.';
  END IF;

  INSERT INTO public.home_members (home_id, user_id, role)
  VALUES (v_invite.home_id, v_uid, v_invite.role)
  ON CONFLICT (home_id, user_id) DO NOTHING;

  UPDATE public.home_invites
     SET status = 'accepted', accepted_at = now(), accepted_by = v_uid
   WHERE id = v_invite.id;

  UPDATE public.profiles SET active_home_id = v_invite.home_id WHERE id = v_uid;

  RETURN v_invite.home_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_home_invite(text) TO authenticated;

-- 8. Uniqueness needed by the upsert above
CREATE UNIQUE INDEX IF NOT EXISTS home_members_home_user_unique
  ON public.home_members (home_id, user_id);