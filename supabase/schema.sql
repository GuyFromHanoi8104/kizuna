-- Kizuna database setup
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.

create table if not exists public.connections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 1 and 120),
  from_country text not null check (from_country ~ '^[A-Z]{2}$'),
  lives_in     text check (lives_in is null or lives_in ~ '^[A-Z]{2}$'),
  contact      text check (contact is null or char_length(contact) <= 200),
  how_met      text not null default 'Other' check (how_met in ('Work', 'Uni', 'Mutual friends', 'Other')),
  created_at   timestamptz not null default now()
);

create index if not exists connections_user_idx on public.connections (user_id);

-- Row Level Security: every user can only see and change their own connections.
alter table public.connections enable row level security;

drop policy if exists "own rows: select" on public.connections;
drop policy if exists "own rows: insert" on public.connections;
drop policy if exists "own rows: update" on public.connections;
drop policy if exists "own rows: delete" on public.connections;

create policy "own rows: select" on public.connections for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows: insert" on public.connections for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own rows: update" on public.connections for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows: delete" on public.connections for delete to authenticated using (user_id = (select auth.uid()));

-- Account deletion (Apple requires apps with sign-up to offer this).
-- Deletes the signed-in user; their connections go with them (on delete cascade).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ───────── Profiles (added Nov 2026) ─────────
-- One row per user: name, optional age, where they're from, where they live, optional phone and photo.

create table if not exists public.profiles (
  id           uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 1 and 80),
  age          int check (age is null or age between 13 and 120),
  from_country text not null check (from_country ~ '^[A-Z]{2}$'),
  lives_in     text not null check (lives_in ~ '^[A-Z]{2}$'),
  phone        text check (phone is null or char_length(phone) <= 40),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile: select" on public.profiles;
drop policy if exists "own profile: insert" on public.profiles;
drop policy if exists "own profile: update" on public.profiles;
drop policy if exists "own profile: delete" on public.profiles;

create policy "own profile: select" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile: insert" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "own profile: update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own profile: delete" on public.profiles for delete to authenticated using (id = (select auth.uid()));

-- Profile pictures: stored at avatars/<user id>/<file>. Anyone with the link can view a picture
-- (the link contains a random user id); only the owner can upload, replace or delete their own.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars: own read" on storage.objects;
drop policy if exists "avatars: own upload" on storage.objects;
drop policy if exists "avatars: own update" on storage.objects;
drop policy if exists "avatars: own delete" on storage.objects;

create policy "avatars: own read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
