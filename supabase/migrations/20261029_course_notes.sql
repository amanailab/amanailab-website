-- ── Per-lecture notes (synced to the user's account) ─────────────────────────

create table if not exists course_notes (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  lecture_id uuid        references course_lectures(id) on delete cascade not null,
  content    text        not null default '',
  updated_at timestamptz default now(),
  unique (user_id, lecture_id)
);

create index if not exists course_notes_user_idx on course_notes (user_id);

alter table course_notes enable row level security;

create policy "user reads own notes"
  on course_notes for select using (auth.uid() = user_id);

create policy "user upserts own notes"
  on course_notes for insert with check (auth.uid() = user_id);

create policy "user updates own notes"
  on course_notes for update using (auth.uid() = user_id);

create policy "user deletes own notes"
  on course_notes for delete using (auth.uid() = user_id);

-- keep updated_at fresh
create trigger course_notes_updated_at
  before update on course_notes
  for each row execute function update_updated_at();
