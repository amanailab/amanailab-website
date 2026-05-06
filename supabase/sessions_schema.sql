-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_interview_sessions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic          TEXT        NOT NULL,
  level          TEXT        NOT NULL,
  question_count INTEGER     NOT NULL,
  avg_score      NUMERIC(4,2) NOT NULL,
  grade          TEXT        NOT NULL,
  entries        JSONB       NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE user_interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON user_interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
