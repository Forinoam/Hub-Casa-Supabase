GRANT EXECUTE ON FUNCTION public.is_home_member(uuid, uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';