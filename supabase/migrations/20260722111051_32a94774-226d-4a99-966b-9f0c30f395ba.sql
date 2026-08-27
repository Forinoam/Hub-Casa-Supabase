GRANT EXECUTE ON FUNCTION public.is_home_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_home_member(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;