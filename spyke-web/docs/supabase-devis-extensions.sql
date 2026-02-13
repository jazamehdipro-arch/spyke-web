-- Spyke (Devis): catalogue prestations + templates
-- Execute in Supabase SQL editor.

-- =========================
-- 1) Catalogue de prestations
-- =========================
create table if not exists public.service_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  unit text not null default 'forfait',
  unit_price_ht numeric not null default 0,
  vat_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_items_user_id_idx on public.service_items(user_id);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists service_items_set_updated_at on public.service_items;
create trigger service_items_set_updated_at
before update on public.service_items
for each row execute function public.set_updated_at();

alter table public.service_items enable row level security;

drop policy if exists "service_items_select_own" on public.service_items;
create policy "service_items_select_own" on public.service_items
for select using (auth.uid() = user_id);

drop policy if exists "service_items_insert_own" on public.service_items;
create policy "service_items_insert_own" on public.service_items
for insert with check (auth.uid() = user_id);

drop policy if exists "service_items_update_own" on public.service_items;
create policy "service_items_update_own" on public.service_items
for update using (auth.uid() = user_id);

drop policy if exists "service_items_delete_own" on public.service_items;
create policy "service_items_delete_own" on public.service_items
for delete using (auth.uid() = user_id);


-- =========================
-- 2) Templates de devis
-- =========================
create table if not exists public.quote_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  validity_days int not null default 30,
  deposit_percent numeric not null default 0,
  payment_delay_days int not null default 30,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_templates_user_id_idx on public.quote_templates(user_id);

drop trigger if exists quote_templates_set_updated_at on public.quote_templates;
create trigger quote_templates_set_updated_at
before update on public.quote_templates
for each row execute function public.set_updated_at();

create table if not exists public.quote_template_lines (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.quote_templates(id) on delete cascade,
  position int not null default 0,
  label text not null default '',
  description text not null default '',
  qty numeric not null default 1,
  unit_price_ht numeric not null default 0,
  vat_rate numeric not null default 0
);

create index if not exists quote_template_lines_template_id_idx on public.quote_template_lines(template_id);

alter table public.quote_templates enable row level security;
alter table public.quote_template_lines enable row level security;

drop policy if exists "quote_templates_select_own" on public.quote_templates;
create policy "quote_templates_select_own" on public.quote_templates
for select using (auth.uid() = user_id);

drop policy if exists "quote_templates_insert_own" on public.quote_templates;
create policy "quote_templates_insert_own" on public.quote_templates
for insert with check (auth.uid() = user_id);

drop policy if exists "quote_templates_update_own" on public.quote_templates;
create policy "quote_templates_update_own" on public.quote_templates
for update using (auth.uid() = user_id);

drop policy if exists "quote_templates_delete_own" on public.quote_templates;
create policy "quote_templates_delete_own" on public.quote_templates
for delete using (auth.uid() = user_id);

-- For lines: allow access if the user owns the template

drop policy if exists "quote_template_lines_select_own" on public.quote_template_lines;
create policy "quote_template_lines_select_own" on public.quote_template_lines
for select using (
  exists (
    select 1 from public.quote_templates t
    where t.id = template_id and t.user_id = auth.uid()
  )
);

drop policy if exists "quote_template_lines_insert_own" on public.quote_template_lines;
create policy "quote_template_lines_insert_own" on public.quote_template_lines
for insert with check (
  exists (
    select 1 from public.quote_templates t
    where t.id = template_id and t.user_id = auth.uid()
  )
);

drop policy if exists "quote_template_lines_update_own" on public.quote_template_lines;
create policy "quote_template_lines_update_own" on public.quote_template_lines
for update using (
  exists (
    select 1 from public.quote_templates t
    where t.id = template_id and t.user_id = auth.uid()
  )
);

drop policy if exists "quote_template_lines_delete_own" on public.quote_template_lines;
create policy "quote_template_lines_delete_own" on public.quote_template_lines
for delete using (
  exists (
    select 1 from public.quote_templates t
    where t.id = template_id and t.user_id = auth.uid()
  )
);
