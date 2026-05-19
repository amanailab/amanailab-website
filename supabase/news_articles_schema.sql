-- News articles
--
-- AI news ingested daily from RSS + NewsData, summarized with Groq.
-- Referenced by:
--   app/api/news/fetch/route.ts   (RSS + NewsData ingest, Groq summarize, upsert)
--   app/news/page.tsx             (public listing)
--   lib/admin-actions.ts          (manual create/update/delete)
--   app/admin/news/page.tsx       (admin list)

CREATE TABLE IF NOT EXISTS public.news_articles (
  id              BIGSERIAL PRIMARY KEY,
  title           TEXT        NOT NULL,
  source          TEXT        NOT NULL,
  source_url      TEXT        UNIQUE NOT NULL,
  summary         TEXT        NOT NULL,
  developer_take  TEXT,
  impact_score    TEXT        NOT NULL DEFAULT 'good_to_know'
                  CHECK (impact_score IN ('game_changer', 'important', 'good_to_know')),
  category        TEXT        NOT NULL DEFAULT 'general'
                  CHECK (category IN ('models', 'research', 'tools', 'agents', 'india_ai', 'general')),
  published_at    TIMESTAMPTZ NOT NULL,
  is_manual       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: lib/admin-actions.ts inserts into a table called `news` (legacy name).
-- Both names appear to refer to the same data — verify which one is live and
-- consider adding a VIEW `news AS SELECT * FROM news_articles` to unify, or
-- migrate the admin path to news_articles.
CREATE OR REPLACE VIEW public.news AS SELECT * FROM public.news_articles;

CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category     ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_impact       ON public.news_articles(impact_score);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read news" ON public.news_articles;
CREATE POLICY "public can read news"
  ON public.news_articles
  FOR SELECT
  USING (true);
