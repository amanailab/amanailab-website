-- Community SD answers — users can share their A/B grade answers for others to learn from
CREATE TABLE IF NOT EXISTS sd_community_answers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_slug TEXT NOT NULL,
  design_text  TEXT NOT NULL,
  score        INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  grade        TEXT NOT NULL CHECK (grade IN ('A','B')),
  upvotes      INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-problem lookups
CREATE INDEX IF NOT EXISTS idx_sd_community_slug ON sd_community_answers (problem_slug, grade, score DESC);

ALTER TABLE sd_community_answers ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public learning resource)
CREATE POLICY "public read community answers"
  ON sd_community_answers FOR SELECT USING (true);

-- Only authenticated users can share
CREATE POLICY "auth users can share"
  ON sd_community_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the author can delete their own answer
CREATE POLICY "owner can delete"
  ON sd_community_answers FOR DELETE
  USING (auth.uid() = user_id);

-- Limit: one published answer per user per problem (upsert-friendly)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sd_community_unique_user_problem
  ON sd_community_answers (user_id, problem_slug);
