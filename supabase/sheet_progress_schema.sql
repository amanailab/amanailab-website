-- Sheet progress: tracks which AI/ML Interview Sheet items a user has completed
-- Each row = one item marked done by one user

CREATE TABLE IF NOT EXISTS sheet_progress (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id      TEXT        NOT NULL,                    -- matches SheetItem.id (e.g. 'gt-1', 'ma-5')
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- Row-Level Security: users can only touch their own rows
ALTER TABLE sheet_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sheet progress"
  ON sheet_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sheet progress"
  ON sheet_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sheet progress"
  ON sheet_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Fast lookup by user (most common query)
CREATE INDEX IF NOT EXISTS sheet_progress_user_idx ON sheet_progress(user_id);

-- Service role can do everything (for server-side admin writes)
CREATE POLICY "Service role full access"
  ON sheet_progress FOR ALL
  USING (auth.role() = 'service_role');
