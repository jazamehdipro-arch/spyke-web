-- Track welcome email so it's sent once per user.

alter table public.profiles
  add column if not exists welcome_sent_at timestamptz;
