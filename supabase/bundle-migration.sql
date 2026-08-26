-- ============================================================
-- Bundle upgrade — run AFTER sd-pro-migration.sql
-- ============================================================

-- 1. Add plan column to subscriptions
alter table sd_subscriptions
  add column if not exists plan text not null default 'sd_pro'
  check (plan in ('sd_pro', 'full_bundle'));

-- 2. Per-tool daily usage tracking (resume, interview, cover letter, etc.)
create table if not exists ai_tool_usage (
  id       bigserial primary key,
  user_id  uuid references auth.users on delete cascade not null,
  tool     text not null,
  used_at  timestamptz default now() not null
);

create index if not exists ai_tool_usage_idx
  on ai_tool_usage (user_id, tool, used_at desc);

alter table ai_tool_usage enable row level security;

create policy "own tool usage" on ai_tool_usage
  for select using (auth.uid() = user_id);
