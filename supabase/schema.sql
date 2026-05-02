-- ============================================================
-- AmanAI Lab — Blog Schema
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. blog_posts table
create table if not exists public.blog_posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text,
  content     text not null default '',
  category    text not null default 'General',
  tags        text[] not null default '{}',
  cover_image text,
  read_time   text not null default '5 min read',
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Index for fast slug lookup (used by blog/[slug] page)
create index if not exists blog_posts_slug_idx on public.blog_posts (slug);

-- 3. Index for listing published posts by date
create index if not exists blog_posts_published_idx on public.blog_posts (published, created_at desc);

-- 4. Row Level Security — allow anon read of published posts only
alter table public.blog_posts enable row level security;

create policy "Public can read published posts"
  on public.blog_posts for select
  using (published = true);

-- 5. Allow service role full access (used by admin panel)
create policy "Service role has full access"
  on public.blog_posts for all
  using (true)
  with check (true);

-- ============================================================
-- Storage bucket for cover images
-- Run this AFTER creating the table
-- ============================================================

-- Create blog-images bucket (public read)
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Allow public read
create policy "Public can view blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- Allow service role to upload
create policy "Service role can upload blog images"
  on storage.objects for insert
  with check (bucket_id = 'blog-images');

create policy "Service role can delete blog images"
  on storage.objects for delete
  using (bucket_id = 'blog-images');
