-- Feedback survey after 10 generations

create table if not exists public.feedback_surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ratings jsonb not null default '{}'::jsonb,
  comments jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.feedback_surveys enable row level security;

-- Allow users to insert their own survey
create policy if not exists "feedback_surveys_insert_own" on public.feedback_surveys
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- profile flags
alter table public.profiles
  add column if not exists feedback_survey_completed_at timestamptz;
