-- Interview questions bank
--
-- The Q&A bank shown at /questions and used by admin CRUD + bulk upload.
-- Referenced by:
--   app/admin/questions/page.tsx        (admin list)
--   lib/admin-actions.ts                (create / update / delete / bulkInsert)
--   app/api/admin/seed-questions/...    (seed endpoint)
--   app/api/admin/bulk-upload/...       (CSV bulk import)

CREATE TABLE IF NOT EXISTS public.interview_questions (
  id          BIGSERIAL PRIMARY KEY,
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  topic       TEXT        NOT NULL,           -- 'LLM', 'RAG', 'Agents', 'Fine-Tuning', 'MLOps', etc.
  level       TEXT        NOT NULL,           -- 'Junior' | 'Mid' | 'Senior' | 'Lead'
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  companies   TEXT[]      NOT NULL DEFAULT '{}',
  source      TEXT,                            -- where it was sourced from (optional)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_topic ON public.interview_questions(topic);
CREATE INDEX IF NOT EXISTS idx_interview_questions_level ON public.interview_questions(level);
CREATE INDEX IF NOT EXISTS idx_interview_questions_tags  ON public.interview_questions USING GIN (tags);

-- Public read-only; service role writes.
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read questions" ON public.interview_questions;
CREATE POLICY "public can read questions"
  ON public.interview_questions
  FOR SELECT
  USING (true);
