-- ── LMS Schema ───────────────────────────────────────────────────────────────

-- Courses
create table if not exists courses (
  id                uuid        default gen_random_uuid() primary key,
  slug              text        unique not null,
  title             text        not null,
  short_description text,
  description       text,
  thumbnail_url     text,
  preview_video_url text,
  price             numeric(10,2) default 0,
  currency          text        default 'INR',
  level             text        default 'beginner' check (level in ('beginner','intermediate','advanced')),
  duration_hours    numeric(5,1),
  is_published      boolean     default false,
  is_free           boolean     default false,
  students_count    integer     default 0,
  rating            numeric(3,2) default 0,
  rating_count      integer     default 0,
  stripe_price_id   text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Course sections (chapters)
create table if not exists course_sections (
  id         uuid    default gen_random_uuid() primary key,
  course_id  uuid    references courses(id) on delete cascade not null,
  title      text    not null,
  position   integer not null default 0,
  created_at timestamptz default now()
);

-- Course lectures (individual lessons)
create table if not exists course_lectures (
  id               uuid    default gen_random_uuid() primary key,
  section_id       uuid    references course_sections(id) on delete cascade not null,
  title            text    not null,
  description      text,
  video_url        text,
  duration_minutes numeric(6,1),
  is_preview       boolean default false,
  position         integer not null default 0,
  created_at       timestamptz default now()
);

-- Enrollments (student bought / enrolled in a course)
create table if not exists enrollments (
  id                 uuid        default gen_random_uuid() primary key,
  user_id            uuid        references auth.users(id) on delete cascade not null,
  course_id          uuid        references courses(id) on delete cascade not null,
  stripe_payment_id  text,
  enrolled_at        timestamptz default now(),
  unique (user_id, course_id)
);

-- Lecture progress (student marked a lecture complete)
create table if not exists lecture_progress (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  lecture_id   uuid        references course_lectures(id) on delete cascade not null,
  completed_at timestamptz default now(),
  unique (user_id, lecture_id)
);

-- Course reviews
create table if not exists course_reviews (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  course_id   uuid        references courses(id) on delete cascade not null,
  rating      integer     not null check (rating between 1 and 5),
  review_text text,
  created_at  timestamptz default now(),
  unique (user_id, course_id)
);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table courses         enable row level security;
alter table course_sections enable row level security;
alter table course_lectures enable row level security;
alter table enrollments     enable row level security;
alter table lecture_progress enable row level security;
alter table course_reviews  enable row level security;

-- Public can read published courses
create policy "public read published courses"
  on courses for select using (is_published = true);

-- Public can read sections/lectures of published courses
create policy "public read sections"
  on course_sections for select
  using (exists (select 1 from courses c where c.id = course_id and c.is_published = true));

create policy "public read lectures"
  on course_lectures for select
  using (exists (
    select 1 from course_sections cs
    join courses c on c.id = cs.course_id
    where cs.id = section_id and c.is_published = true
  ));

-- Enrolled users can read their enrollments
create policy "user reads own enrollments"
  on enrollments for select using (auth.uid() = user_id);

create policy "user insert enrollment"
  on enrollments for insert with check (auth.uid() = user_id);

-- Progress — users manage their own
create policy "user reads own progress"
  on lecture_progress for select using (auth.uid() = user_id);

create policy "user insert progress"
  on lecture_progress for insert with check (auth.uid() = user_id);

create policy "user delete progress"
  on lecture_progress for delete using (auth.uid() = user_id);

-- Reviews
create policy "public read reviews"
  on course_reviews for select using (true);

create policy "user insert review"
  on course_reviews for insert with check (auth.uid() = user_id);

create policy "user update own review"
  on course_reviews for update using (auth.uid() = user_id);

-- ── Triggers ─────────────────────────────────────────────────────────────────

-- Auto-update updated_at on courses
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger courses_updated_at
  before update on courses
  for each row execute function update_updated_at();

-- Auto-update students_count when enrollment changes
create or replace function sync_students_count()
returns trigger language plpgsql as $$
begin
  update courses set students_count = (
    select count(*) from enrollments where course_id = coalesce(new.course_id, old.course_id)
  ) where id = coalesce(new.course_id, old.course_id);
  return coalesce(new, old);
end;
$$;

create trigger enrollment_count_insert
  after insert on enrollments
  for each row execute function sync_students_count();

create trigger enrollment_count_delete
  after delete on enrollments
  for each row execute function sync_students_count();

-- Auto-update course rating when review changes
create or replace function sync_course_rating()
returns trigger language plpgsql as $$
declare cid uuid;
begin
  cid := coalesce(new.course_id, old.course_id);
  update courses set
    rating       = (select round(avg(rating)::numeric, 2) from course_reviews where course_id = cid),
    rating_count = (select count(*) from course_reviews where course_id = cid)
  where id = cid;
  return coalesce(new, old);
end;
$$;

create trigger review_rating_sync
  after insert or update or delete on course_reviews
  for each row execute function sync_course_rating();
