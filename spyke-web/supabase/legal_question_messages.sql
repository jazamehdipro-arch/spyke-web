-- Legal question messages (history thread)
-- Run this in Supabase SQL editor.

create table if not exists public.legal_question_messages (
  id uuid primary key default gen_random_uuid(),
  legal_question_id uuid not null references public.legal_questions(id) on delete cascade,
  role text not null check (role in ('user','jurist','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists legal_question_messages_q_created_idx
  on public.legal_question_messages (legal_question_id, created_at asc);

alter table public.legal_question_messages enable row level security;

-- Users can read messages for their own questions.
drop policy if exists "legal_question_messages_select_own" on public.legal_question_messages;
create policy "legal_question_messages_select_own"
  on public.legal_question_messages
  for select
  using (
    exists (
      select 1
      from public.legal_questions q
      where q.id = legal_question_id
        and q.user_id = auth.uid()
    )
  );

-- No direct inserts from users for now (messages created by service role).
