-- Create a table to store per-user Gmail refresh tokens.
-- IMPORTANT: refresh tokens grant send access. Keep this table locked down.

create table if not exists public.google_gmail_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  gmail_email text,
  updated_at timestamptz not null default now()
);

-- If the table already exists, ensure the email column exists too.
alter table public.google_gmail_tokens
  add column if not exists gmail_email text;

alter table public.google_gmail_tokens enable row level security;

-- Only the owner can read/write their own row (client-side).
create policy "read own gmail token" on public.google_gmail_tokens
for select
to authenticated
using (auth.uid() = user_id);

create policy "upsert own gmail token" on public.google_gmail_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "update own gmail token" on public.google_gmail_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- No deletes from client.
