-- System Design submissions + AI reviews
--
-- Persists user system-design answers and the AI grader's feedback so they
-- can be revisited from the dashboard.
-- Referenced by:
--   app/api/system-design/submissions/route.ts   (save / list)
--   app/api/system-design/review/route.ts        (review then save when logged in)
--   app/system-design/[slug]/DesignPad.tsx       (sync from client)

CREATE TABLE IF NOT EXISTS public.system_design_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_slug    TEXT NOT NULL,
  problem_title   TEXT NOT NULL,
  design          TEXT NOT NULL,
  checklist       JSONB NOT NULL DEFAULT '{}'::jsonb,
  word_count      INT,
  -- AI review (may be null if user saved a draft without requesting review)
  review_score    INT,                     -- 1-10
  review_grade    TEXT,                    -- 'A' | 'B' | 'C' | 'D'
  review_summary  TEXT,
  review_json     JSONB,                   -- full ReviewResult payload
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One in-progress row per user per problem (upsert on this constraint).
CREATE UNIQUE INDEX IF NOT EXISTS uq_system_design_submissions_user_problem
  ON public.system_design_submissions(user_id, problem_slug);

CREATE INDEX IF NOT EXISTS idx_system_design_submissions_user
  ON public.system_design_submissions(user_id, updated_at DESC);

ALTER TABLE public.system_design_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners read their submissions"   ON public.system_design_submissions;
DROP POLICY IF EXISTS "owners insert their submissions" ON public.system_design_submissions;
DROP POLICY IF EXISTS "owners update their submissions" ON public.system_design_submissions;
DROP POLICY IF EXISTS "owners delete their submissions" ON public.system_design_submissions;

CREATE POLICY "owners read their submissions"
  ON public.system_design_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owners insert their submissions"
  ON public.system_design_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owners update their submissions"
  ON public.system_design_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "owners delete their submissions"
  ON public.system_design_submissions FOR DELETE
  USING (auth.uid() = user_id);
