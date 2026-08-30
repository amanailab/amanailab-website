-- ============================================================
-- Notes Packages (PDF Bundles) — run in Supabase SQL Editor
-- Run AFTER notes table and notes storage bucket exist.
-- ============================================================

-- 1. packages table
create table if not exists public.packages (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  price       integer not null,                   -- in rupees (e.g. 399)
  emoji       text not null default '📦',
  gradient    text not null default 'from-orange-600 to-amber-500',
  note_ids    text[] not null default '{}',       -- array of note UUIDs
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- 2. Index for listing active packages
create index if not exists packages_active_sort_idx
  on public.packages (is_active, sort_order asc, created_at desc);

-- 3. RLS — no public read (accessed only via service key in routes)
alter table public.packages enable row level security;

-- Allow service role full access (admin panel + API routes use service key)
-- No anon policy needed — routes use getAdminSupabase()


-- ============================================================
-- orders table (create if it doesn't already exist)
-- If it already exists, the CREATE TABLE IF NOT EXISTS is a no-op.
-- ============================================================

create table if not exists public.orders (
  id                   bigserial primary key,
  user_id              uuid references auth.users(id) on delete set null,
  type                 text not null,                   -- 'package' | 'sd_pro' | 'full_bundle'
  item_id              text not null default '',
  item_title           text not null default '',
  amount               integer not null default 0,      -- in paise (100 = ₹1)
  razorpay_payment_id  text,
  razorpay_order_id    text,
  customer_email       text,
  customer_name        text,
  customer_contact     text,
  status               text not null default 'completed',
  via                  text not null default 'payment', -- 'payment' | 'member_code'
  created_at           timestamptz not null default now()
);

create index if not exists orders_user_id_idx
  on public.orders (user_id);

create index if not exists orders_payment_id_idx
  on public.orders (razorpay_payment_id);

create index if not exists orders_type_created_idx
  on public.orders (type, created_at desc);

alter table public.orders enable row level security;

-- Users can see their own orders (routes use service key for admin)
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);
