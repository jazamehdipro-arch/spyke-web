create table if not exists public.player_locations (
  user_id text primary key,
  username text not null,
  creature_name text not null,
  creature_type text not null,
  level integer not null check (level between 1 and 30),
  latitude double precision not null,
  longitude double precision not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.device_push_tokens (
  user_id text not null,
  expo_push_token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (user_id, expo_push_token)
);

create table if not exists public.crossing_events (
  id uuid primary key default gen_random_uuid(),
  player_a text not null,
  player_b text not null,
  player_a_snapshot jsonb not null,
  player_b_snapshot jsonb not null,
  distance_meters double precision not null,
  status text not null default 'pending' check (status in ('pending', 'queued', 'resolved', 'expired')),
  resolution jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists player_locations_updated_at_idx
  on public.player_locations (updated_at desc);

create index if not exists crossing_events_player_a_idx
  on public.crossing_events (player_a, created_at desc);

create index if not exists crossing_events_player_b_idx
  on public.crossing_events (player_b, created_at desc);
create extension if not exists pgcrypto;
