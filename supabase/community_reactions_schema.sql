-- Community post reactions
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- before deploying the reaction persistence feature.

create table if not exists public.community_reactions (
  post_id    uuid    references public.community_posts(id) on delete cascade,
  session_id text    not null,
  reaction   text    not null,
  created_at timestamptz not null default now(),
  primary key (post_id, session_id)
);

create index if not exists community_reactions_post_idx on public.community_reactions(post_id);

alter table public.community_reactions enable row level security;

-- Anyone can read reaction counts (we aggregate server-side)
create policy "public read reactions" on public.community_reactions for select using (true);
-- Anyone can upsert their own session reaction
create policy "anyone can react" on public.community_reactions for insert with check (true);
create policy "anyone can update reaction" on public.community_reactions for update using (true);
create policy "anyone can delete reaction" on public.community_reactions for delete using (true);

-- Grants
grant select on public.community_reactions to anon;
grant select, insert, update, delete on public.community_reactions to authenticated;
grant select, insert, update, delete on public.community_reactions to service_role;
