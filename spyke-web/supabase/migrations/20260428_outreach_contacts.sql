-- Outreach leads table (already created manually in Supabase dashboard)
-- This file documents the schema for version control

CREATE TABLE IF NOT EXISTS outreach_contacts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL UNIQUE,
  name        TEXT,
  job_title   TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending',  -- pending | sent | error
  error_msg   TEXT,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outreach_contacts_status_idx ON outreach_contacts(status);
CREATE INDEX IF NOT EXISTS outreach_contacts_created_at_idx ON outreach_contacts(created_at);
