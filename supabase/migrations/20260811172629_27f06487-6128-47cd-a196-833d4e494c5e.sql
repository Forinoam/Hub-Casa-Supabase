CREATE INDEX IF NOT EXISTS tasks_home_due_idx ON public.tasks (home_id, due_date);
CREATE INDEX IF NOT EXISTS tasks_home_completed_idx ON public.tasks (home_id, completed);
CREATE INDEX IF NOT EXISTS events_home_start_idx ON public.events (home_id, start_at);
CREATE INDEX IF NOT EXISTS expenses_home_due_idx ON public.expenses (home_id, due_date);
CREATE INDEX IF NOT EXISTS expenses_home_kind_paid_idx ON public.expenses (home_id, kind, paid);
CREATE INDEX IF NOT EXISTS shopping_items_home_bought_idx ON public.shopping_items (home_id, bought);
CREATE INDEX IF NOT EXISTS maintenance_items_home_next_due_idx ON public.maintenance_items (home_id, next_due);
CREATE INDEX IF NOT EXISTS memories_home_date_idx ON public.memories (home_id, date DESC);
CREATE INDEX IF NOT EXISTS categories_home_module_idx ON public.categories (home_id, module);
CREATE INDEX IF NOT EXISTS incomes_home_idx ON public.incomes (home_id);
CREATE INDEX IF NOT EXISTS home_members_user_idx ON public.home_members (user_id);
CREATE INDEX IF NOT EXISTS task_history_home_completed_idx ON public.task_history (home_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS achievements_home_user_idx ON public.achievements (home_id, user_id);
CREATE INDEX IF NOT EXISTS ai_messages_home_created_idx ON public.ai_messages (home_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_insights_home_resolved_idx ON public.ai_insights (home_id, resolved);

REVOKE ALL ON FUNCTION private.is_home_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_home_admin(uuid, uuid) TO authenticated, service_role;