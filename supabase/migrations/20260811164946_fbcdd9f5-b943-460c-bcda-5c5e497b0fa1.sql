create extension if not exists pg_net with schema extensions;

-- remove o job quebrado (usava uma função http inexistente)
do $$
declare j record;
begin
  for j in select jobname from cron.job where jobname is not null loop
    if j.jobname like '%notification%' then
      perform cron.unschedule(j.jobname);
    end if;
  end loop;
end $$;

create or replace function public.list_due_event_reminders(_limit integer default 200)
returns table(
  source_type text,
  source_id uuid,
  home_id uuid,
  recipient_user_id uuid,
  scheduled_for timestamp with time zone,
  title text,
  body text,
  payload jsonb
)
language sql
security definer
set search_path to 'public'
as $function$
  with events_due as (
    select
      'event'::text as source_type,
      e.id as source_id,
      e.home_id,
      e.title,
      (e.start_at - make_interval(mins => e.reminder_minutes)) as scheduled_for,
      case when e.reminder_minutes = 0 then 'O compromisso começa agora.'
           else format('Lembrete do compromisso em %s minutos.', e.reminder_minutes) end as body,
      e.assigned_to as target_user,
      e.created_by,
      (e.visibility = 'shared') as fanout,
      '/calendario'::text as url
    from public.events e
    where e.status = 'pending'
      and e.reminder_minutes is not null
      and (e.start_at - make_interval(mins => e.reminder_minutes)) <= now()
      and e.start_at >= now() - interval '1 day'
  ),
  tasks_due as (
    select
      'task'::text as source_type,
      t.id as source_id,
      t.home_id,
      t.title,
      ((t.due_date::timestamp + coalesce(t.due_time, time '09:00')) at time zone 'America/Sao_Paulo') as scheduled_for,
      'Tarefa da casa para hoje.'::text as body,
      t.assignee as target_user,
      t.created_by,
      (t.assignee is null) as fanout,
      '/tarefas'::text as url
    from public.tasks t
    where t.completed = false
      and t.due_date is not null
      and ((t.due_date::timestamp + coalesce(t.due_time, time '09:00')) at time zone 'America/Sao_Paulo') <= now()
      and t.due_date >= (current_date - 1)
  ),
  bills_due as (
    select
      'bill'::text as source_type,
      x.id as source_id,
      x.home_id,
      x.description as title,
      ((x.due_date::timestamp + time '09:00') at time zone 'America/Sao_Paulo') as scheduled_for,
      'Conta a pagar com vencimento hoje.'::text as body,
      x.assigned_to as target_user,
      x.created_by,
      (x.assigned_to is null) as fanout,
      '/financeiro'::text as url
    from public.expenses x
    where x.paid = false
      and x.kind = 'bill'
      and x.due_date is not null
      and ((x.due_date::timestamp + time '09:00') at time zone 'America/Sao_Paulo') <= now()
      and x.due_date >= (current_date - 1)
  ),
  maintenance_due as (
    select
      'maintenance'::text as source_type,
      m.id as source_id,
      m.home_id,
      m.name as title,
      ((m.next_due::timestamp + time '09:00') at time zone 'America/Sao_Paulo') as scheduled_for,
      'Manutenção prevista para hoje.'::text as body,
      m.assignee as target_user,
      null::uuid as created_by,
      (m.assignee is null) as fanout,
      '/manutencao'::text as url
    from public.maintenance_items m
    where m.next_due is not null
      and ((m.next_due::timestamp + time '09:00') at time zone 'America/Sao_Paulo') <= now()
      and m.next_due >= (current_date - 1)
  ),
  all_due as (
    select * from events_due
    union all select * from tasks_due
    union all select * from bills_due
    union all select * from maintenance_due
    order by scheduled_for asc
    limit _limit
  ),
  fanout_rows as (
    select
      d.source_type,
      d.source_id,
      d.home_id,
      coalesce(d.target_user, case when d.fanout then hm.user_id else d.created_by end) as recipient_user_id,
      d.scheduled_for,
      d.title,
      d.body,
      jsonb_build_object(
        'source_type', d.source_type,
        'source_id', d.source_id,
        'home_id', d.home_id,
        'title', d.title,
        'url', d.url,
        'scheduled_for', d.scheduled_for
      ) as payload
    from all_due d
    left join public.home_members hm
      on hm.home_id = d.home_id
     and d.target_user is null
     and d.fanout
  )
  select distinct source_type, source_id, home_id, recipient_user_id, scheduled_for, title, body, payload
  from fanout_rows
  where recipient_user_id is not null
  order by scheduled_for asc, source_id asc, recipient_user_id asc;
$function$;

revoke all on function public.list_due_event_reminders(integer) from public, anon, authenticated;
grant execute on function public.list_due_event_reminders(integer) to service_role;

select cron.schedule(
  'casa-hub-notification-processor',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://frtbirigrhggyyxcqann.supabase.co/functions/v1/notification-processor',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydGJpcmlncmhnZ3l5eGNxYW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NTIxNjIsImV4cCI6MjEwMDIyODE2Mn0.Z7jM5JJpLXxRO-fKGkCqvmzDBUNBpAww8R5cBz09jpQ","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydGJpcmlncmhnZ3l5eGNxYW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NTIxNjIsImV4cCI6MjEwMDIyODE2Mn0.Z7jM5JJpLXxRO-fKGkCqvmzDBUNBpAww8R5cBz09jpQ"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);