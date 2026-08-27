GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.is_home_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_home_member(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_home_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_home_member(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_home_member(uuid, uuid) FROM authenticated;
NOTIFY pgrst, 'reload schema';