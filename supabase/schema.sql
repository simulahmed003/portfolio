-- Portfolio storage and permissions. Safe to run more than once (Supabase > SQL Editor > New query > Run).
--
-- Rows in portfolio_content:
--   main             what visitors see (hidden items already removed). Anyone may read it.
--   admin            the full content, including hidden projects and drafts. Admin only.
--   history-<time>   a copy of every save (the last 30), for "Backups and history". Admin only.
--
-- The admin is whoever signs in with the email in portfolio_is_admin() below. To change the admin,
-- change the email there (one place) and set ADMIN_EMAIL / NEXT_PUBLIC_ADMIN_EMAIL in Vercel to match.

create table if not exists public.portfolio_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

create or replace function public.portfolio_is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = lower('simulahmed003@gmail.com'), false)
$$;

-- Visitors read only the published row; the admin reads everything.
drop policy if exists "portfolio content is public" on public.portfolio_content;
create policy "portfolio content is public" on public.portfolio_content
  for select to anon, authenticated
  using (id = 'main' or (select public.portfolio_is_admin()));

-- Only the admin writes. (Separate policies per action keep reads governed by the one policy above.)
drop policy if exists "portfolio admin can write" on public.portfolio_content;
drop policy if exists "portfolio admin inserts" on public.portfolio_content;
create policy "portfolio admin inserts" on public.portfolio_content
  for insert to authenticated
  with check ((select public.portfolio_is_admin()));
drop policy if exists "portfolio admin updates" on public.portfolio_content;
create policy "portfolio admin updates" on public.portfolio_content
  for update to authenticated
  using ((select public.portfolio_is_admin()))
  with check ((select public.portfolio_is_admin()));
drop policy if exists "portfolio admin deletes" on public.portfolio_content;
create policy "portfolio admin deletes" on public.portfolio_content
  for delete to authenticated
  using ((select public.portfolio_is_admin()));

-- Public bucket for photos, certificates and the CV. Files are public by address; only the admin
-- can upload, replace, delete or list them (listing is used by "Find unused files").
insert into storage.buckets (id, name, public, file_size_limit)
values ('portfolio-media', 'portfolio-media', true, 20971520)
on conflict (id) do update set public = true;

drop policy if exists "portfolio admin uploads" on storage.objects;
create policy "portfolio admin uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()));

drop policy if exists "portfolio admin updates" on storage.objects;
create policy "portfolio admin updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()))
  with check (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()));

drop policy if exists "portfolio admin deletes" on storage.objects;
create policy "portfolio admin deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()));

drop policy if exists "portfolio admin lists media" on storage.objects;
create policy "portfolio admin lists media" on storage.objects
  for select to authenticated
  using (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()));
