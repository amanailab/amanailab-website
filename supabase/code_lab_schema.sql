-- ── AI/ML Code Lab — run this in Supabase SQL editor ────────────────────────

CREATE TABLE IF NOT EXISTS code_problems (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT         NOT NULL,
  slug          TEXT         UNIQUE NOT NULL,
  description   TEXT         NOT NULL,
  difficulty    TEXT         NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  topic         TEXT         NOT NULL,
  tags          TEXT[]       DEFAULT '{}',
  starter_code  TEXT         NOT NULL DEFAULT '',
  solution_code TEXT,
  test_cases    JSONB        NOT NULL DEFAULT '[]',
  hints         TEXT[]       DEFAULT '{}',
  companies     TEXT[]       DEFAULT '{}',
  order_index   INTEGER      DEFAULT 0,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_submissions (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem_id    UUID         REFERENCES code_problems(id) ON DELETE CASCADE NOT NULL,
  code          TEXT         NOT NULL,
  status        TEXT         NOT NULL,
  passed_tests  INTEGER      DEFAULT 0,
  total_tests   INTEGER      DEFAULT 0,
  runtime_ms    INTEGER,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE code_problems   ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can read problems
CREATE POLICY "public read problems"
  ON code_problems FOR SELECT USING (true);

-- Users can read/insert own submissions
CREATE POLICY "users read own submissions"
  ON code_submissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users insert own submissions"
  ON code_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
