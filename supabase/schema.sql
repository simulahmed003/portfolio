-- Portfolio admin storage. Safe to run more than once.
-- Replace the email below if the admin account changes (also set ADMIN_EMAIL in Vercel).

create table if not exists public.portfolio_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

drop policy if exists "portfolio content is public" on public.portfolio_content;
create policy "portfolio content is public" on public.portfolio_content
  for select using (true);

drop policy if exists "portfolio admin can write" on public.portfolio_content;
create policy "portfolio admin can write" on public.portfolio_content
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'simulahmed003@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'simulahmed003@gmail.com');

-- Public bucket for uploaded images and the CV
insert into storage.buckets (id, name, public, file_size_limit)
values ('portfolio-media', 'portfolio-media', true, 20971520)
on conflict (id) do update set public = true;

drop policy if exists "portfolio admin uploads" on storage.objects;
create policy "portfolio admin uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-media' and (auth.jwt() ->> 'email') = 'simulahmed003@gmail.com');

drop policy if exists "portfolio admin updates" on storage.objects;
create policy "portfolio admin updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-media' and (auth.jwt() ->> 'email') = 'simulahmed003@gmail.com');

drop policy if exists "portfolio admin deletes" on storage.objects;
create policy "portfolio admin deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-media' and (auth.jwt() ->> 'email') = 'simulahmed003@gmail.com');
