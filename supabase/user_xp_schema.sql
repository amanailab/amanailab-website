-- User XP table — persists Code Lab XP across devices
create table if not exists user_xp (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  xp         int  not null default 0,
  updated_at timestamptz default now()
);

-- RLS
alter table user_xp enable row level security;

-- Users can only read their own XP
create policy "read own xp"
  on user_xp for select
  using (auth.uid() = user_id);

-- Service role handles inserts/updates (via API route)
