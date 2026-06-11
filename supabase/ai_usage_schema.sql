-- Daily usage counters for paid-AI routes (resume, cover letter, linkedin, etc.)
-- Run this in the Supabase SQL editor. Accessed only via the service role —
-- no public RLS policies on purpose.

create table if not exists ai_usage (
  identifier text not null,        -- 'user:<uuid>:<feature>' or 'ip:<addr>:<feature>'
  day        date not null,
  count      integer not null default 0,
  primary key (identifier, day)
);

alter table ai_usage enable row level security;

-- Atomic increment; returns the new count for today.
create or replace function increment_ai_usage(p_identifier text, p_day date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into ai_usage (identifier, day, count)
  values (p_identifier, p_day, 1)
  on conflict (identifier, day)
  do update set count = ai_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

-- Housekeeping: old rows are tiny, but you can clear them periodically:
-- delete from ai_usage where day < current_date - interval '7 days';
