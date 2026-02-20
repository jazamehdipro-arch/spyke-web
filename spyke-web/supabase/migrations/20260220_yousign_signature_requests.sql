-- Yousign signature requests MVP
-- Creates signature_requests table and RLS policies.

begin;

create table if not exists public.signature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  contract_id uuid null references public.contracts (id) on delete set null,
  quote_id uuid null references public.quotes (id) on delete set null,

  provider text not null default 'yousign',
  provider_request_id text not null,
  provider_document_id text null,
  provider_signer_id text null,

  status text not null default 'created',
  signing_url text null,

  signed_pdf_path text null,

  last_event_name text null,
  last_event_payload jsonb null,
  last_webhook_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure one request id is not duplicated.
create unique index if not exists signature_requests_provider_request_id_key
  on public.signature_requests(provider, provider_request_id);

create index if not exists signature_requests_user_id_idx
  on public.signature_requests(user_id);

create index if not exists signature_requests_contract_id_idx
  on public.signature_requests(contract_id);

create index if not exists signature_requests_quote_id_idx
  on public.signature_requests(quote_id);

alter table public.signature_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='signature_requests' and policyname='signature_requests_select_own'
  ) then
    create policy signature_requests_select_own
      on public.signature_requests
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='signature_requests' and policyname='signature_requests_insert_own'
  ) then
    create policy signature_requests_insert_own
      on public.signature_requests
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='signature_requests' and policyname='signature_requests_update_own'
  ) then
    create policy signature_requests_update_own
      on public.signature_requests
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- updated_at trigger (reuse if project already has it; create a local one if not)
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname='set_signature_requests_updated_at'
  ) then
    create trigger set_signature_requests_updated_at
      before update on public.signature_requests
      for each row
      execute function public.set_updated_at_timestamp();
  end if;
end $$;

commit;
