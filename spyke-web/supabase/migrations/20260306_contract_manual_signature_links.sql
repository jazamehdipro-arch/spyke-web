-- Manual contract signing links (public URL + client signature)

-- 1) Storage buckets
insert into storage.buckets (id, name, public)
values ('contract_signatures', 'contract_signatures', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('signed_contracts', 'signed_contracts', false)
on conflict (id) do nothing;

-- 2) Signing links table
create table if not exists public.contract_sign_links (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  token text not null unique,
  pdf_url text not null,
  buyer_name text default '',
  buyer_email text default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  signed_at timestamptz,
  signed_place text default '',
  signature_path text default '',
  signed_pdf_path text default '',
  signer_ip text default '',
  signer_user_agent text default ''
);

create index if not exists contract_sign_links_contract_id_idx on public.contract_sign_links(contract_id);
create index if not exists contract_sign_links_token_idx on public.contract_sign_links(token);

-- 3) RLS
alter table public.contract_sign_links enable row level security;

-- Owners can list their links
-- Postgres doesn't support "create policy if not exists". Make it idempotent.
do $$
begin
  create policy "contract_sign_links_select_owner" on public.contract_sign_links
  for select
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_sign_links.contract_id
        and c.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then
    null;
end $$;

-- Owners can insert links for their contracts
do $$
begin
  create policy "contract_sign_links_insert_owner" on public.contract_sign_links
  for insert
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_sign_links.contract_id
        and c.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then
    null;
end $$;

-- Owners can update their links
do $$
begin
  create policy "contract_sign_links_update_owner" on public.contract_sign_links
  for update
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_sign_links.contract_id
        and c.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then
    null;
end $$;

-- Owners can delete their links
do $$
begin
  create policy "contract_sign_links_delete_owner" on public.contract_sign_links
  for delete
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_sign_links.contract_id
        and c.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then
    null;
end $$;

-- Note: public access to signing links is handled server-side in Next API routes via service role,
-- not via RLS, so we keep RLS strict.
