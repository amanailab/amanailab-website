-- ============================================================
-- AmanAI Lab — Security hardening migration
-- Closes the data-exposure / public-write gaps found in the June 2026 audit.
-- Run once in: Supabase → SQL Editor. Idempotent — safe to run multiple times.
-- ============================================================

-- ── 1. blog_comments: stop exposing commenter emails to anon ────────────────
-- The "read approved comments" RLS policy returns whole rows, and anon had a
-- table-wide SELECT grant — so anyone could query user_email. Switch anon to a
-- COLUMN-level grant that excludes user_email. The app reads user_id only to
-- compute an "is_own" flag server-side; it never returns it to the browser.
REVOKE SELECT ON public.blog_comments FROM anon;
GRANT SELECT (id, slug, user_name, user_id, body, approved, created_at)
  ON public.blog_comments TO anon;

-- ── 2. community_posts: remove anonymous direct INSERT ──────────────────────
-- Submissions must go through /api/community/posts (rate-limited + sanitized +
-- uses the service-role key). Drop the public insert policy and revoke INSERT
-- so the table can't be spammed directly via PostgREST. Also restrict anon
-- SELECT to non-PII columns (no author_email).
DROP POLICY IF EXISTS "Anyone can insert post" ON public.community_posts;
REVOKE INSERT ON public.community_posts FROM anon;
REVOKE INSERT ON public.community_posts FROM authenticated;

REVOKE SELECT ON public.community_posts FROM anon;
GRANT SELECT (id, author_name, title, body, type, company_slug, created_at, approved)
  ON public.community_posts TO anon;
REVOKE SELECT ON public.community_posts FROM authenticated;
GRANT SELECT (id, author_name, title, body, type, company_slug, created_at, approved)
  ON public.community_posts TO authenticated;

-- ── 3. Scope catch-all "service role full access" policies to service_role ──
-- These were written as USING(true)/WITH CHECK(true) with no role qualifier, so
-- they applied to every role. Exposure is currently bounded by GRANTs, but it's
-- a latent footgun — pin them to the service_role.
DROP POLICY IF EXISTS "Service role full access companies" ON public.companies;
CREATE POLICY "Service role full access companies" ON public.companies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access company questions" ON public.company_questions;
CREATE POLICY "Service role full access company questions" ON public.company_questions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access posts" ON public.community_posts;
CREATE POLICY "Service role full access posts" ON public.community_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- blog_posts has the same pattern (defined in schema.sql).
DROP POLICY IF EXISTS "Service role has full access" ON public.blog_posts;
CREATE POLICY "Service role has full access" ON public.blog_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 4. community_reactions: only the service role may write ─────────────────
-- Reactions go through /api/community/react (service-role key). Keep public
-- read, but remove the anon/authenticated write ability so counts can't be
-- forged/deleted directly via PostgREST.
REVOKE INSERT, UPDATE, DELETE ON public.community_reactions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.community_reactions FROM authenticated;
