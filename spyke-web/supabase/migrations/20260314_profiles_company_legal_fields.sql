-- Add legal/company fields used to generate contracts from profile defaults
-- Safe: IF NOT EXISTS for Postgres

alter table public.profiles
  add column if not exists legal_form text,
  add column if not exists capital_amount text,
  add column if not exists rcs_city text,
  add column if not exists rcs_number text,
  add column if not exists representative_name text,
  add column if not exists representative_role text;
