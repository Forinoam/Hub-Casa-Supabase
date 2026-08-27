-- Home invites table
CREATE TABLE public.home_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE ON public.home_invites TO authenticated;
GRANT ALL ON public.home_invites TO service_role;
ALTER TABLE public.home_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for home_invites
CREATE POLICY "home_invites select own home" ON public.home_invites FOR SELECT TO authenticated
  USING (public.is_home_member(home_id, auth.uid()));

CREATE POLICY "home_invites insert by home members" ON public.home_invites FOR INSERT TO authenticated
  WITH CHECK (public.is_home_member(home_id, auth.uid()));

CREATE POLICY "home_invites update by home members" ON public.home_invites FOR UPDATE TO authenticated
  USING (public.is_home_member(home_id, auth.uid()));

-- Function to redeem invite code
CREATE OR REPLACE FUNCTION public.redeem_home_invite(invite_code TEXT)
RETURNS TABLE(home_id UUID, home_name TEXT, role TEXT) 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invite home_invites;
  v_home homes;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Find and validate invite
  SELECT * INTO v_invite FROM home_invites WHERE code = UPPER(invite_code);
  
  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  IF v_invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Este convite já foi utilizado';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Este convite expirou';
  END IF;

  -- Get home info
  SELECT * INTO v_home FROM homes WHERE id = v_invite.home_id;
  IF v_home IS NULL THEN
    RAISE EXCEPTION 'Casa não encontrada';
  END IF;

  -- Check if user is already a member
  IF EXISTS(SELECT 1 FROM home_members WHERE home_id = v_invite.home_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Você já é membro desta casa';
  END IF;

  -- Add user to home_members as member
  INSERT INTO home_members (home_id, user_id, role)
  VALUES (v_invite.home_id, v_user_id, 'member')
  ON CONFLICT DO NOTHING;

  -- Mark invite as used
  UPDATE home_invites 
  SET used_at = now(), used_by = v_user_id
  WHERE id = v_invite.id;

  -- Return result
  RETURN QUERY SELECT v_invite.home_id, v_home.name, 'member'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_home_invite(TEXT) TO authenticated;