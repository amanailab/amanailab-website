-- ============================================================
-- System Design Pro — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Subscription table (who has paid and until when)
create table if not exists sd_subscriptions (
  user_id          uuid references auth.users on delete cascade primary key,
  plan             text not null default 'sd_pro',
  subscribed_until timestamptz not null,
  razorpay_payment_id text,
  razorpay_order_id   text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- If the table already exists without the plan column, add it:
alter table sd_subscriptions add column if not exists plan text not null default 'sd_pro';

-- 2. Every AI review usage (one row per review run)
create table if not exists sd_review_usage (
  id           bigserial primary key,
  user_id      uuid references auth.users on delete cascade not null,
  problem_slug text not null default '',
  used_at      timestamptz default now() not null
);

create index if not exists sd_review_usage_user_date
  on sd_review_usage (user_id, used_at desc);

-- 3. RLS — only admins can read via service key (routes use service key)
alter table sd_subscriptions  enable row level security;
alter table sd_review_usage   enable row level security;

-- Users can see their own rows (optional — routes use service key anyway)
create policy "own subs" on sd_subscriptions  for select using (auth.uid() = user_id);
create policy "own usage" on sd_review_usage  for select using (auth.uid() = user_id);
