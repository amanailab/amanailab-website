-- ============================================================
-- System Design: cloud-saved designs + cached reference solutions
-- Run in the Supabase SQL editor. Accessed only via the service role.
-- ============================================================

-- 1. Per-user saved designs (resume across devices)
create table if not exists public.sd_saved_designs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  slug       text not null,
  design     text not null default '',
  checklist  jsonb not null default '{}'::jsonb,
  code       jsonb not null default '{}'::jsonb,   -- { snippets: [...], activeId }
  canvas     jsonb not null default '{}'::jsonb,   -- { nodes: [...], edges: [...] }
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)
);

alter table public.sd_saved_designs enable row level security;
-- No anon policies: all access is through service-role API routes.

-- 2. Cached AI reference solutions (generated once per problem, shared)
create table if not exists public.sd_reference_solutions (
  slug       text primary key,
  content    jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.sd_reference_solutions enable row level security;
