-- ============================================================================
-- TALENT GLOBE — Add Tier and Spotlight Rank Persistence
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

-- 1. Add tier and spotlight_rank columns
alter table public.projects
  add column if not exists tier integer default 4,
  add column if not exists spotlight_rank integer;

-- 2. Retroactively mark claimed #1 spotlights as Tier 5 VIP
update public.projects
set tier = 5, spotlight_rank = 1
where project_metric ilike '%Spotlight #1%'
   or project_badge ilike '%Spotlight #1%'
   or role ilike '%Founder & Creator%';

-- 3. Add performance indexes for fast rank-based queries
create index if not exists projects_tier_idx on public.projects (tier);
create index if not exists projects_spotlight_rank_idx on public.projects (spotlight_rank);
