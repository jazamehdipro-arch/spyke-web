alter table public.crossing_events
add column if not exists pair_key text;

update public.crossing_events
set pair_key = least(player_a, player_b) || ':' || greatest(player_a, player_b)
where pair_key is null;

create index if not exists crossing_events_pair_key_created_at_idx
on public.crossing_events(pair_key, created_at desc);

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

do $$
begin
  perform cron.unschedule('process-crossings-every-minute');
exception
  when others then null;
end $$;

do $$
begin
  perform cron.unschedule('send-crossing-notifications-every-minute');
exception
  when others then null;
end $$;

select cron.schedule(
  'process-crossings-every-minute',
  '* * * * *',
  $$
  select
    net.http_post(
      url := 'https://uxuljhtzuxhehowmuxsx.supabase.co/functions/v1/process-crossings',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

select cron.schedule(
  'send-crossing-notifications-every-minute',
  '* * * * *',
  $$
  select
    net.http_post(
      url := 'https://uxuljhtzuxhehowmuxsx.supabase.co/functions/v1/send-crossing-notifications',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
