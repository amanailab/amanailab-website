-- ============================================================
-- AmanAI Lab — Explicit Data API Grants
-- Required by Supabase policy change (enforced Oct 30, 2026):
-- all public schema tables need explicit GRANTs for PostgREST/supabase-js.
--
-- Run this once in: Supabase → SQL Editor → New Query → Run
-- Safe to run multiple times (GRANTs are idempotent).
-- ============================================================

-- ── blog_posts ──────────────────────────────────────────────
-- anon: reads published posts (filtered by RLS)
-- authenticated: reads any post (still RLS-filtered)
-- service_role: full access for admin panel
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT ON public.blog_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO service_role;

-- ── user_interview_sessions ──────────────────────────────────
-- Only authenticated users interact with their own sessions (RLS enforced)
GRANT SELECT, INSERT ON public.user_interview_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interview_sessions TO service_role;

-- ── user_xp ─────────────────────────────────────────────────
-- Users read own XP; API routes use service_role for upsert
GRANT SELECT ON public.user_xp TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_xp TO service_role;

-- ── companies ────────────────────────────────────────────────
-- Public read; admin manages via service_role
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO service_role;

-- ── company_questions ────────────────────────────────────────
GRANT SELECT ON public.company_questions TO anon;
GRANT SELECT ON public.company_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_questions TO service_role;

-- ── community_posts ──────────────────────────────────────────
-- anon: reads approved posts + can submit (policy allows it)
-- authenticated: same + can submit with uid
GRANT SELECT, INSERT ON public.community_posts TO anon;
GRANT SELECT, INSERT ON public.community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO service_role;

-- ── code_problems ────────────────────────────────────────────
-- Public read; admin manages via service_role
GRANT SELECT ON public.code_problems TO anon;
GRANT SELECT ON public.code_problems TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_problems TO service_role;

-- ── code_submissions ─────────────────────────────────────────
-- Only authenticated users; RLS restricts to own rows
GRANT SELECT, INSERT ON public.code_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_submissions TO service_role;

-- ── blog_comments ────────────────────────────────────────────
-- anon reads approved comments; authenticated can insert + delete own
GRANT SELECT ON public.blog_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.blog_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_comments TO service_role;

-- ── daily_completions ────────────────────────────────────────
-- Only authenticated users; RLS restricts to own rows
GRANT SELECT, INSERT ON public.daily_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_completions TO service_role;

-- ── job_applications ─────────────────────────────────────────
-- Users manage their own applications (full CRUD via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO service_role;
