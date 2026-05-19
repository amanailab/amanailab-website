-- Misc tables referenced by code but not previously in repo
--
-- Includes:
--   resources           — downloadable PDFs / guides (admin uploads)
--   contact_messages    — /contact form submissions
--   course_waitlist     — paid course interest list

-- ─── resources ────────────────────────────────────────────────────────────────
-- Referenced by:
--   lib/admin-actions.ts                    (createResource, deleteResource)
--   app/api/admin/resources/upload/...      (file upload then row insert)
--   app/resources/page.tsx                  (public listing)

CREATE TABLE IF NOT EXISTS public.resources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL,           -- e.g. 'interview', 'mlops', 'llm', 'rag'
  file_url     TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  is_free      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public can read resources" ON public.resources;
CREATE POLICY "public can read resources"
  ON public.resources
  FOR SELECT
  USING (true);

-- ─── contact_messages ─────────────────────────────────────────────────────────
-- Referenced by:
--   app/api/contact/route.ts                (insert from form)
--   app/admin/emails/page.tsx               (admin list)

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
-- No SELECT policy — only the service role reads this from the admin page.

-- ─── course_waitlist ──────────────────────────────────────────────────────────
-- Referenced by:
--   app/admin/emails/page.tsx               (admin list)
--   (insert path is wherever the "Join Waitlist" CTA submits)

CREATE TABLE IF NOT EXISTS public.course_waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_waitlist_email ON public.course_waitlist(email);

ALTER TABLE public.course_waitlist ENABLE ROW LEVEL SECURITY;
-- No SELECT policy — only the service role reads this.
