-- Signatures (storage + profile column)
-- Run this in Supabase SQL editor.

-- 1) Add profile column
alter table public.profiles
  add column if not exists signature_path text;

-- 2) Create storage bucket "signatures" (do this in Storage UI if you prefer)
-- Note: some Supabase projects restrict bucket creation to the dashboard.
-- If SQL bucket creation isn't available, create it manually.

-- 3) Recommended: keep bucket private and serve via signed URLs (not implemented yet)
