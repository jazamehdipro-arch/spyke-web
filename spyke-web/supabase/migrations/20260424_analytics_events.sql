-- Analytics events (admin-only read)

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid null,
  event_name text not null,
  path text null,
  properties jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_user_id_idx on public.analytics_events (user_id);

alter table public.analytics_events enable row level security;

-- Allow anyone (anon/auth) to insert events.
-- Note: admin-only read is enforced below.
create policy "analytics_events_insert_all"
  on public.analytics_events
  for insert
  to public
  with check (true);

-- Only allow the owner/admin email to read events.
create policy "analytics_events_select_admin_email"
  on public.analytics_events
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'Jazamehdi.pro@gmail.com');

-- Aggregated view for dashboard (last ~90 days; filter in UI as needed)
create or replace view public.analytics_daily_metrics as
select
  date_trunc('day', created_at)::date as day,
  count(*) as total_events,
  count(*) filter (where event_name = 'page_view') as page_views,
  count(*) filter (where event_name = 'pdf_generated') as pdf_generated,
  count(*) filter (where event_name = 'pdf_failed') as pdf_failed,
  count(*) filter (where event_name = 'email_sent') as email_sent,
  count(*) filter (where event_name = 'email_failed') as email_failed
from public.analytics_events
group by 1
order by 1 desc;
