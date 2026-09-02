-- ============================================================
-- FIX: ensure sd_review_usage exists (safe to run multiple times)
-- Run this whole file in the Supabase SQL Editor.
-- It will NOT error even if parts already exist.
-- ============================================================

-- 1. Usage table — one row per AI review run
create table if not exists sd_review_usage (
  id           bigserial primary key,
  user_id      uuid references auth.users on delete cascade not null,
  problem_slug text not null default '',
  used_at      timestamptz default now() not null
);

create index if not exists sd_review_usage_user_date
  on sd_review_usage (user_id, used_at desc);

-- 2. Subscription table (in case it's missing) + plan column
create table if not exists sd_subscriptions (
  user_id             uuid references auth.users on delete cascade primary key,
  plan                text not null default 'sd_pro',
  subscribed_until    timestamptz not null,
  razorpay_payment_id text,
  razorpay_order_id   text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table sd_subscriptions add column if not exists plan text not null default 'sd_pro';

-- 3. Enable RLS (routes use the service key, which bypasses RLS anyway)
alter table sd_subscriptions enable row level security;
alter table sd_review_usage  enable row level security;

-- 4. Policies — drop-then-create so re-running never errors
drop policy if exists "own subs"  on sd_subscriptions;
drop policy if exists "own usage" on sd_review_usage;
create policy "own subs"  on sd_subscriptions for select using (auth.uid() = user_id);
create policy "own usage" on sd_review_usage  for select using (auth.uid() = user_id);

-- 5. Sanity check — should return a count (0 is fine), NOT an error
select count(*) as usage_rows from sd_review_usage;
