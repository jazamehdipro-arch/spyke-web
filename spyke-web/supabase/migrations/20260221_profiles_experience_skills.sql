-- Add experience + skills to profiles
-- Apply in Supabase SQL editor if migrations aren't auto-applied.

alter table public.profiles
  add column if not exists experience_years integer;

alter table public.profiles
  add column if not exists skills text[];
