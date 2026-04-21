-- Credit notes (avoirs) + invoice reminders (relances)

create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid null references public.invoices(id) on delete set null,
  number text not null,
  date_issue date not null,
  reference_invoice_number text null,
  client_id uuid null references public.clients(id) on delete set null,
  buyer_snapshot jsonb null,
  seller_snapshot jsonb null,
  total_ht numeric null,
  total_tva numeric null,
  total_ttc numeric null,
  created_at timestamptz not null default now()
);

create index if not exists credit_notes_user_id_created_at_idx on public.credit_notes(user_id, created_at desc);
create index if not exists credit_notes_user_id_number_idx on public.credit_notes(user_id, number);

create table if not exists public.credit_note_lines (
  id uuid primary key default gen_random_uuid(),
  credit_note_id uuid not null references public.credit_notes(id) on delete cascade,
  description text not null default '',
  qty numeric not null default 0,
  unit_price numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists credit_note_lines_credit_note_id_idx on public.credit_note_lines(credit_note_id);

create table if not exists public.invoice_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  level int not null default 1,
  scheduled_at timestamptz not null,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists invoice_reminders_user_id_scheduled_at_idx on public.invoice_reminders(user_id, scheduled_at asc);
create index if not exists invoice_reminders_invoice_id_idx on public.invoice_reminders(invoice_id);
