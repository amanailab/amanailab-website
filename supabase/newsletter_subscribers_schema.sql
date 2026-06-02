-- ============================================================
-- AmanAI Lab — newsletter_subscribers
-- This table holds the entire email list + verification tokens. It must NEVER
-- be readable/writable by anon or authenticated roles — ALL access goes through
-- server routes that use the service-role key (which bypasses RLS). RLS is
-- enabled with no anon/authenticated policies, so PostgREST exposes nothing.
--
-- Run once in: Supabase → SQL Editor. Safe to run multiple times.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT        NOT NULL UNIQUE,
  source             TEXT        DEFAULT 'unknown',
  verified           BOOLEAN     NOT NULL DEFAULT false,
  verification_token TEXT,
  token_expires_at   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON public.newsletter_subscribers (email);

-- Enable RLS and define NO anon/authenticated policies → no PostgREST access.
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Explicitly ensure the public API roles have NO direct privileges.
REVOKE ALL ON public.newsletter_subscribers FROM anon;
REVOKE ALL ON public.newsletter_subscribers FROM authenticated;

-- Server routes use the service-role key, which bypasses RLS and grants.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO service_role;

-- Same protection for the contact_messages table (best-effort persisted by
-- /api/contact via the service key) — never expose it to the public roles.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_messages FROM anon;
REVOKE ALL ON public.contact_messages FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO service_role;
