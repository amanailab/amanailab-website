-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS job_applications (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name  TEXT         NOT NULL,
  role_title    TEXT         NOT NULL,
  status        TEXT         NOT NULL DEFAULT 'wishlist',
  location      TEXT,
  salary_range  TEXT,
  notes         TEXT,
  applied_date  DATE,
  company_slug  TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own applications"
  ON job_applications
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
