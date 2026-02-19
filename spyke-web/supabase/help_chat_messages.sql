-- Help chat messages (Spyke)
-- Run this in Supabase SQL editor.

create table if not exists public.help_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists help_chat_messages_user_created_idx
  on public.help_chat_messages (user_id, created_at);

alter table public.help_chat_messages enable row level security;

-- Users can read their own messages
-- Note: Postgres doesn't support "create policy if not exists" in some versions.
drop policy if exists "help_chat_messages_select_own" on public.help_chat_messages;
create policy "help_chat_messages_select_own"
  on public.help_chat_messages
  for select
  using (auth.uid() = user_id);

-- Users can insert their own messages
drop policy if exists "help_chat_messages_insert_own" on public.help_chat_messages;
create policy "help_chat_messages_insert_own"
  on public.help_chat_messages
  for insert
  with check (auth.uid() = user_id);
