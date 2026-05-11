-- Daily challenge completions — server-side streak persistence
create table if not exists daily_completions (
  user_id     uuid        references auth.users(id) on delete cascade,
  date        text        not null,  -- YYYY-MM-DD local date
  question_id int         null,
  score       numeric     null,
  xp_awarded  boolean     not null default false,
  created_at  timestamptz not null default now(),
  primary key (user_id, date)
);

create index if not exists daily_completions_user_date on daily_completions(user_id, date desc);

alter table daily_completions enable row level security;

create policy "users read own completions"
  on daily_completions for select using (auth.uid() = user_id);

create policy "users insert own completions"
  on daily_completions for insert with check (auth.uid() = user_id);
