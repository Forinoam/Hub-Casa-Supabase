CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled_events boolean NOT NULL DEFAULT true,
  enabled_tasks boolean NOT NULL DEFAULT true,
  enabled_bills boolean NOT NULL DEFAULT true,
  enabled_maintenance boolean NOT NULL DEFAULT true,
  enabled_shopping boolean NOT NULL DEFAULT false,
  enabled_budget boolean NOT NULL DEFAULT true,
  daily_digest_time time NOT NULL DEFAULT '09:00',
  quiet_hours_start time,
  quiet_hours_end time,
  shopping_weekday integer NOT NULL DEFAULT 6,
  bill_lead_days integer NOT NULL DEFAULT 0,
  maintenance_lead_days integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (home_id, user_id),
  CONSTRAINT notification_preferences_shopping_weekday_check CHECK (shopping_weekday BETWEEN 0 AND 6),
  CONSTRAINT notification_preferences_bill_lead_check CHECK (bill_lead_days BETWEEN 0 AND 7),
  CONSTRAINT notification_preferences_maintenance_lead_check CHECK (maintenance_lead_days BETWEEN 0 AND 7)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own notification preferences"
ON public.notification_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid() AND public.is_home_member(home_id, auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_home_member(home_id, auth.uid()));

CREATE TRIGGER notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_notification_preferences_home_user
ON public.notification_preferences (home_id, user_id);

CREATE OR REPLACE FUNCTION public.list_due_event_reminders(_limit integer DEFAULT 200)
 RETURNS TABLE(source_type text, source_id uuid, home_id uuid, recipient_user_id uuid, scheduled_for timestamp with time zone, title text, body text, payload jsonb)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with candidates as (
    -- Compromissos: horário exato do lembrete
    select
      'event'::text as source_type,
      e.id as source_id,
      e.home_id,
      e.title,
      case when e.reminder_minutes = 0 then 'O compromisso começa agora.'
           else format('Lembrete do compromisso em %s minutos.', e.reminder_minutes) end as body,
      '/calendario'::text as url,
      e.assigned_to as target_user,
      e.created_by,
      (e.visibility = 'shared') as fanout,
      (e.start_at - make_interval(mins => e.reminder_minutes)) as anchor_ts,
      null::date as anchor_date,
      null::time as anchor_time,
      0 as lead_kind
    from public.events e
    where e.status = 'pending'
      and e.reminder_minutes is not null
      and (e.start_at - make_interval(mins => e.reminder_minutes)) <= now()
      and e.start_at >= now() - interval '1 day'

    union all
    -- Tarefas com data
    select
      'task', t.id, t.home_id, t.title,
      'Tarefa da casa para hoje.', '/tarefas',
      t.assignee, t.created_by, (t.assignee is null),
      null::timestamptz, t.due_date, t.due_time, 0
    from public.tasks t
    where t.completed = false
      and t.due_date is not null
      and t.due_date between (current_date - 1) and (current_date + 1)

    union all
    -- Contas a pagar
    select
      'bill', x.id, x.home_id, x.description,
      'Conta a pagar chegando ao vencimento.', '/financeiro',
      x.assigned_to, x.created_by, (x.assigned_to is null),
      null::timestamptz, x.due_date, null::time, 1
    from public.expenses x
    where x.paid = false
      and x.kind = 'bill'
      and x.due_date is not null
      and x.due_date between (current_date - 1) and (current_date + 7)

    union all
    -- Manutenções
    select
      'maintenance', m.id, m.home_id, m.name,
      'Manutenção prevista.', '/manutencao',
      m.assignee, null::uuid, (m.assignee is null),
      null::timestamptz, m.next_due, null::time, 2
    from public.maintenance_items m
    where m.next_due is not null
      and m.next_due between (current_date - 1) and (current_date + 7)

    union all
    -- Lista de compras: um aviso por casa, no dia escolhido
    select
      'shopping', s.home_id, s.home_id,
      format('%s itens na lista de compras', s.pending),
      'Ainda há itens pendentes na lista de compras.', '/compras',
      null::uuid, null::uuid, true,
      null::timestamptz, current_date, null::time, 3
    from (
      select home_id, count(*) as pending
      from public.shopping_items
      where bought = false
      group by home_id
    ) s

    union all
    -- Orçamento: categoria acima de 90% do limite do mês
    select
      'budget', b.id, b.home_id,
      format('Orçamento de %s', b.category),
      format('Você já usou %s%% do orçamento de %s neste mês.', round(b.used / b.amount * 100), b.category),
      '/financeiro',
      null::uuid, null::uuid, true,
      null::timestamptz, date_trunc('month', current_date)::date, null::time, 4
    from (
      select
        bu.id, bu.home_id, bu.category, bu.amount,
        coalesce((
          select sum(coalesce(x.amount, 0))
          from public.expenses x
          where x.home_id = bu.home_id
            and x.category = bu.category
            and x.created_at >= date_trunc('month', now())
        ), 0) as used
      from public.budgets bu
      where bu.amount > 0
    ) b
    where b.used >= b.amount * 0.9
  ),
  fanout_rows as (
    select
      c.*,
      coalesce(c.target_user, case when c.fanout then hm.user_id else c.created_by end) as recipient_user_id
    from candidates c
    left join public.home_members hm
      on hm.home_id = c.home_id
     and c.target_user is null
     and c.fanout
  ),
  with_prefs as (
    select distinct
      f.source_type,
      f.source_id,
      f.home_id,
      f.recipient_user_id,
      f.title,
      f.body,
      f.url,
      case
        when f.anchor_ts is not null then f.anchor_ts
        else (
          ((f.anchor_date - make_interval(days => case f.lead_kind
              when 1 then coalesce(p.bill_lead_days, 0)
              when 2 then coalesce(p.maintenance_lead_days, 0)
              else 0 end))
            + coalesce(f.anchor_time, coalesce(p.daily_digest_time, time '09:00')))
          at time zone 'America/Sao_Paulo'
        )
      end as scheduled_for,
      coalesce(p.enabled_events, true) as enabled_events,
      coalesce(p.enabled_tasks, true) as enabled_tasks,
      coalesce(p.enabled_bills, true) as enabled_bills,
      coalesce(p.enabled_maintenance, true) as enabled_maintenance,
      coalesce(p.enabled_shopping, false) as enabled_shopping,
      coalesce(p.enabled_budget, true) as enabled_budget,
      coalesce(p.shopping_weekday, 6) as shopping_weekday,
      p.quiet_hours_start,
      p.quiet_hours_end
    from fanout_rows f
    left join public.notification_preferences p
      on p.home_id = f.home_id and p.user_id = f.recipient_user_id
    where f.recipient_user_id is not null
  ),
  filtered as (
    select *
    from with_prefs w
    where w.scheduled_for <= now()
      and w.scheduled_for >= now() - interval '2 days'
      and case w.source_type
        when 'event' then w.enabled_events
        when 'task' then w.enabled_tasks
        when 'bill' then w.enabled_bills
        when 'maintenance' then w.enabled_maintenance
        when 'shopping' then w.enabled_shopping and extract(dow from (now() at time zone 'America/Sao_Paulo'))::int = w.shopping_weekday
        when 'budget' then w.enabled_budget
        else true
      end
      and (
        w.quiet_hours_start is null or w.quiet_hours_end is null
        or not (
          case
            when w.quiet_hours_start < w.quiet_hours_end
              then (now() at time zone 'America/Sao_Paulo')::time >= w.quiet_hours_start
                   and (now() at time zone 'America/Sao_Paulo')::time < w.quiet_hours_end
            else (now() at time zone 'America/Sao_Paulo')::time >= w.quiet_hours_start
                 or (now() at time zone 'America/Sao_Paulo')::time < w.quiet_hours_end
          end
        )
      )
  )
  select
    source_type,
    source_id,
    home_id,
    recipient_user_id,
    scheduled_for,
    title,
    body,
    jsonb_build_object(
      'source_type', source_type,
      'source_id', source_id,
      'home_id', home_id,
      'title', title,
      'url', url,
      'scheduled_for', scheduled_for
    ) as payload
  from filtered
  order by scheduled_for asc, source_id asc, recipient_user_id asc
  limit _limit;
$function$;
