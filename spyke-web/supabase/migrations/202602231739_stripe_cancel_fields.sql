-- Add Stripe cancel fields so UI can show "cancelled at period end" status
-- and keep Pro until the end of the billing period.

alter table public.profiles
  add column if not exists stripe_cancel_at_period_end boolean;

alter table public.profiles
  add column if not exists stripe_cancel_at timestamptz;
