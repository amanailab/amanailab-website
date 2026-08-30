-- System Design Problems — admin-managed problems stored in DB
-- Run in Supabase → SQL Editor → New Query → Run

CREATE TABLE IF NOT EXISTS public.sd_problems (
  id                   SERIAL PRIMARY KEY,
  slug                 TEXT UNIQUE NOT NULL,
  title                TEXT NOT NULL,
  difficulty           TEXT NOT NULL DEFAULT 'Hard' CHECK (difficulty IN ('Medium', 'Hard')),
  category             TEXT NOT NULL DEFAULT 'ML Systems',
  companies            TEXT[] NOT NULL DEFAULT '{}',
  problem              TEXT NOT NULL DEFAULT '',
  constraints          TEXT[] NOT NULL DEFAULT '{}',
  key_areas            TEXT[] NOT NULL DEFAULT '{}',
  hints                TEXT[] NOT NULL DEFAULT '{}',
  linked_sheet_item_id TEXT NOT NULL DEFAULT '',
  is_active            BOOLEAN NOT NULL DEFAULT true,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookups by slug (used on the workspace page)
CREATE INDEX IF NOT EXISTS sd_problems_slug_idx      ON public.sd_problems (slug);
CREATE INDEX IF NOT EXISTS sd_problems_active_idx    ON public.sd_problems (is_active, sort_order);

-- Only admins can write; the public can read active problems
ALTER TABLE public.sd_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active sd_problems"
  ON public.sd_problems FOR SELECT
  USING (is_active = true);

-- Admin writes go through the service-role key (no RLS for service role)
