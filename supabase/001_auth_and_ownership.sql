-- ============================================================================
-- TALENT GLOBE — enable authenticated ownership + real persistence
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Why: public.projects currently has RLS enabled with no INSERT policy, so
-- every submission from the app fails with 42501 and is silently discarded.
-- There is also no owner column, so nothing can be scoped to a user for edit.
-- ============================================================================

-- 1. Ownership + audit columns -----------------------------------------------
alter table public.projects
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists projects_user_id_idx on public.projects (user_id);

-- 2. Row level security ------------------------------------------------------
alter table public.projects enable row level security;

-- Anyone (including signed-out visitors) may read the globe.
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read
  on public.projects for select
  using (true);

-- Only a signed-in user may create a project, and only as themselves.
drop policy if exists projects_owner_insert on public.projects;
create policy projects_owner_insert
  on public.projects for insert to authenticated
  with check (auth.uid() = user_id);

-- Only the owner may edit their own project.
drop policy if exists projects_owner_update on public.projects;
create policy projects_owner_update
  on public.projects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only the owner may delete their own project.
drop policy if exists projects_owner_delete on public.projects;
create policy projects_owner_delete
  on public.projects for delete to authenticated
  using (auth.uid() = user_id);

-- 3. Keep updated_at honest --------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();
