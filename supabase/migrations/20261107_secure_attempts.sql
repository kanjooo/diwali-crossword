-- Keep participant records private when Supabase is accessed directly.
-- The existing /api/submit endpoint writes with the service-role key, which
-- bypasses RLS. /api/scores verifies the teacher's session before querying
-- with that same server-only key.
alter table public.attempts enable row level security;

revoke all on table public.attempts from anon, authenticated;

-- Remove any previously-created public policies before applying this migration.
drop policy if exists "Public read attempts" on public.attempts;
drop policy if exists "Public insert attempts" on public.attempts;
drop policy if exists "Allow public access" on public.attempts;
