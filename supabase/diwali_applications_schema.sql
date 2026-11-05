-- ============================================================
-- Diwali AI Accelerator applications + payments
-- Run in Supabase SQL Editor (safe to run more than once)
-- ============================================================

create table if not exists public.diwali_applications (
  id            bigserial primary key,
  name          text not null,
  email         text not null unique,
  whatsapp      text not null,
  role          text,
  experience    text,
  python_level  text,
  goal          text,
  why           text,
  status        text not null default 'new', -- 'new' | 'call_scheduled' | 'selected' | 'paid' | 'rejected'
  created_at    timestamptz not null default now()
);

-- Payment columns (added later, so use alter ... if not exists)
alter table public.diwali_applications add column if not exists payment_plan        text;    -- 'deposit' | 'full'
alter table public.diwali_applications add column if not exists amount_paid         integer; -- in paise
alter table public.diwali_applications add column if not exists razorpay_order_id   text;
alter table public.diwali_applications add column if not exists razorpay_payment_id text;
alter table public.diwali_applications add column if not exists paid_at             timestamptz;

create index if not exists diwali_applications_status_idx
  on public.diwali_applications (status, created_at desc);

-- RLS — no public access, only the service key
alter table public.diwali_applications enable row level security;
