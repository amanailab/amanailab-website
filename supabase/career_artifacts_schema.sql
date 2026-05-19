-- Career artifacts
--
-- Saved outputs from the Career tools (roadmap, skill-gap, offer analysis,
-- study plan, etc.) so users can revisit instead of regenerating each time.
-- Referenced by:
--   app/api/career/artifacts/route.ts        (save / list / get / delete)
--   components/career/CareerTools.tsx        ("Save to my history" buttons)
--   app/dashboard/page.tsx                   (recent artifacts card)

CREATE TABLE IF NOT EXISTS public.career_artifacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL                           -- 'roadmap' | 'skill_gap' | 'offer_analysis' | 'study_plan' | 'interview_plan' | 'company_research'
                CHECK (kind IN ('roadmap','skill_gap','offer_analysis','study_plan','interview_plan','company_research')),
  title         TEXT NOT NULL,                          -- short display label, e.g. "ML Engineer roadmap"
  payload       JSONB NOT NULL,                         -- the actual generated result
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_artifacts_user_kind ON public.career_artifacts(user_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_artifacts_user     ON public.career_artifacts(user_id, created_at DESC);

ALTER TABLE public.career_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners read their career artifacts"   ON public.career_artifacts;
DROP POLICY IF EXISTS "owners insert their career artifacts" ON public.career_artifacts;
DROP POLICY IF EXISTS "owners delete their career artifacts" ON public.career_artifacts;

CREATE POLICY "owners read their career artifacts"
  ON public.career_artifacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owners insert their career artifacts"
  ON public.career_artifacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owners delete their career artifacts"
  ON public.career_artifacts FOR DELETE
  USING (auth.uid() = user_id);
