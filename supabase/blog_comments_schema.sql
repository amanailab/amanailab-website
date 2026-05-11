-- Blog comments table
create table if not exists blog_comments (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  user_id     uuid references auth.users(id) on delete cascade,
  user_name   text not null,
  user_email  text not null,
  body        text not null,
  approved    boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists blog_comments_slug_idx on blog_comments(slug, approved, created_at);

-- RLS
alter table blog_comments enable row level security;

-- Anyone can read approved comments
create policy "read approved comments"
  on blog_comments for select
  using (approved = true);

-- Logged-in users can insert their own
create policy "insert own comment"
  on blog_comments for insert
  with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "delete own comment"
  on blog_comments for delete
  using (auth.uid() = user_id);
