-- Legal questions (Question juriste) - Spyke
-- Run this in Supabase SQL editor.

create table if not exists public.legal_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  question text not null,
  status text not null default 'draft' check (status in ('draft','paid','sent','failed')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  -- token used by jurists to access a dedicated reply page (no login)
  jurist_token text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  sent_at timestamptz
);

create index if not exists legal_questions_user_created_idx
  on public.legal_questions (user_id, created_at desc);

alter table public.legal_questions enable row level security;

-- Users can read their own questions
drop policy if exists "legal_questions_select_own" on public.legal_questions;
create policy "legal_questions_select_own"
  on public.legal_questions
  for select
  using (auth.uid() = user_id);

-- Users can insert their own questions (draft)
drop policy if exists "legal_questions_insert_own" on public.legal_questions;
create policy "legal_questions_insert_own"
  on public.legal_questions
  for insert
  with check (auth.uid() = user_id);

-- No user updates/deletes (handled by service role via webhook)
