-- ============================================================
-- Diwali AI Accelerator applications — run in Supabase SQL Editor
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

create index if not exists diwali_applications_status_idx
  on public.diwali_applications (status, created_at desc);

-- RLS — no public access, only the service key
alter table public.diwali_applications enable row level security;
