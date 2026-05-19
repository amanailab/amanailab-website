-- Newsletter subscribers
--
-- Stores email signups + double-opt-in verification state.
-- Referenced by:
--   app/api/email/subscribe/route.ts        (insert/update + token)
--   app/api/email/confirm/route.ts          (verify via token)
--   app/api/email/unsubscribe/route.ts      (mark unsubscribed)
--   app/api/admin/newsletter/send/route.ts  (campaign blast)
--   app/api/user/delete-account/route.ts    (cascade delete)
--   app/admin/emails/page.tsx               (list)
--   lib/admin-actions.ts                    (admin delete)

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT UNIQUE NOT NULL,
  source              TEXT,                     -- 'footer', 'modal', 'tool-X', etc.
  verified            BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token  TEXT,
  token_expires_at    TIMESTAMPTZ,
  unsubscribed_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email    ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_verified ON public.newsletter_subscribers(verified);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token    ON public.newsletter_subscribers(verification_token);

-- Only the service role touches this table. Public clients cannot read or write.
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
