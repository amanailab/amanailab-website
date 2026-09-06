-- Run in Supabase SQL Editor
alter table public.masterclass_registrations
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists masterclass_reg_user_idx
  on public.masterclass_registrations (user_id);
