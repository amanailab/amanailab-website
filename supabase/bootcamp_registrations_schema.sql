-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS bootcamp_registrations (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  email      text        NOT NULL,
  phone      text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Prevent duplicate email registrations
CREATE UNIQUE INDEX IF NOT EXISTS bootcamp_registrations_email_idx
  ON bootcamp_registrations (email);

-- Only the service role can read/write (no public access)
ALTER TABLE bootcamp_registrations ENABLE ROW LEVEL SECURITY;
