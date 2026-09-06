-- ============================================================
-- Masterclass Registrations — run in Supabase SQL Editor
-- ============================================================

create table if not exists public.masterclass_registrations (
  id                   bigserial primary key,
  name                 text,
  email                text not null unique,
  whatsapp             text,
  tier                 text not null default 'early',      -- 'early' | 'regular'
  via                  text not null default 'interest_form', -- 'interest_form' | 'payment'
  amount               integer default 0,                  -- in paise (799900 or 999900)
  razorpay_payment_id  text,
  razorpay_order_id    text,
  status               text default 'interest',            -- 'interest' | 'paid'
  created_at           timestamptz not null default now()
);

-- Index for admin queries
create index if not exists masterclass_reg_via_idx
  on public.masterclass_registrations (via, created_at desc);

-- RLS — no public access, only service key
alter table public.masterclass_registrations enable row level security;
