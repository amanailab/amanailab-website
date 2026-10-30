-- ── LMS hardening + resume/progress support ──────────────────────────────────
-- Run in the Supabase SQL editor (safe to re-run).

-- 1. Enrollment can no longer be self-inserted from the browser.
--    Free enrolment + paid enrolment now go through server routes (service key).
drop policy if exists "user insert enrollment" on enrollments;

alter table enrollments add column if not exists razorpay_order_id text;
alter table enrollments add column if not exists amount_paid numeric(10,2);
create unique index if not exists enrollments_order_uidx
  on enrollments (razorpay_order_id) where razorpay_order_id is not null;

-- 2. Video URLs of paid lectures must not be readable by everyone.
--    Public/authenticated roles may read every lecture column EXCEPT video_url.
--    The classroom fetches playable URLs through /api/lectures/[id]/video,
--    which checks enrolment (or is_preview) first.
revoke select on course_lectures from anon, authenticated;
grant  select (id, section_id, title, description, duration_minutes, is_preview, position, created_at)
  on course_lectures to anon, authenticated;

-- 3. Progress + reviews only for enrolled students.
drop policy if exists "user insert progress" on lecture_progress;
create policy "user insert progress"
  on lecture_progress for insert with check (
    auth.uid() = user_id and exists (
      select 1 from course_lectures l
      join course_sections s on s.id = l.section_id
      join enrollments e on e.course_id = s.course_id and e.user_id = auth.uid()
      where l.id = lecture_id
    )
  );

drop policy if exists "user insert review" on course_reviews;
create policy "user insert review"
  on course_reviews for insert with check (
    auth.uid() = user_id and exists (
      select 1 from enrollments e where e.user_id = auth.uid() and e.course_id = course_reviews.course_id
    )
  );

-- 4. Playback position per lecture (resume where you left off).
create table if not exists lecture_positions (
  user_id          uuid        references auth.users(id) on delete cascade not null,
  lecture_id       uuid        references course_lectures(id) on delete cascade not null,
  course_id        uuid        references courses(id) on delete cascade not null,
  position_seconds integer     not null default 0,
  updated_at       timestamptz default now(),
  primary key (user_id, lecture_id)
);
create index if not exists lecture_positions_user_course_idx
  on lecture_positions (user_id, course_id, updated_at desc);

alter table lecture_positions enable row level security;
drop policy if exists "user reads own positions" on lecture_positions;
create policy "user reads own positions"
  on lecture_positions for select using (auth.uid() = user_id);
-- writes happen server-side only (service key)

-- 5. Helpful indexes
create index if not exists course_sections_course_idx on course_sections (course_id, position);
create index if not exists course_lectures_section_idx on course_lectures (section_id, position);

-- 6. Storage: make the `course-videos` bucket PRIVATE (Storage → course-videos → Edit bucket).
--    Uploaded videos are then served only via short-lived signed URLs after an enrolment check.
