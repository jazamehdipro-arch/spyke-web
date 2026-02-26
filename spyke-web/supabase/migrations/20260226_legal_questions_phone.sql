-- Add optional phone number for jurist questions
alter table public.legal_questions
  add column if not exists contact_phone text;
