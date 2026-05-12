-- Run this in Supabase SQL Editor (safe to run multiple times)

-- Initial table (if not already created)
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

-- v2 additions (safe to run even if columns already exist)
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS priority      TEXT DEFAULT 'normal';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS interview_date DATE;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS job_url        TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS recruiter_name TEXT;

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy (safe to re-create with IF NOT EXISTS workaround)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'job_applications'
    AND policyname = 'Users manage own applications'
  ) THEN
    EXECUTE 'CREATE POLICY "Users manage own applications"
      ON job_applications
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
