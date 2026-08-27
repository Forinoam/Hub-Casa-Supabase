REVOKE EXECUTE ON FUNCTION public.list_due_event_reminders(integer) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_due_event_reminders(integer) TO service_role;