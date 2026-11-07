# Diwali Crossword

The student crossword remains available at `/`. Teachers use `/admin` to sign
in with Supabase Auth and view submissions.

## Deployment configuration

Add these Vercel environment variables for every deployment environment:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Supabase's public anonymous key, used by the `/admin` login page only. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by `/api/submit` and `/api/scores`; never expose it to a browser. |
| `TEACHER_EMAIL_ALLOWLIST` | Comma-separated, case-insensitive list of teacher emails permitted to read scores. |

Create teacher accounts manually in **Supabase Dashboard → Authentication → Users**.
Do not enable a public registration flow. An authenticated account is still
denied participant data unless its email is in `TEACHER_EMAIL_ALLOWLIST`.

## Database security

Apply [`supabase/migrations/20261107_secure_attempts.sql`](supabase/migrations/20261107_secure_attempts.sql)
and [`supabase/migrations/20261107_add_city_to_attempts.sql`](supabase/migrations/20261107_add_city_to_attempts.sql)
using the Supabase SQL Editor (or your migration workflow). They enable RLS,
keep direct reads private, and add the nullable `city` column without changing
existing submissions. The security migration also
revokes direct `anon` and `authenticated` access to `public.attempts`. The
existing student submission endpoint continues to work because it writes only
on the Vercel server using the service-role key.

## Deploy and verify

1. Add the variables above in Vercel, deploy, and apply the SQL migration.
2. Visit `/admin`, sign in with an allowlisted teacher account, and confirm the dashboard loads.
3. Confirm a logged-out request to `/api/scores` returns `401`, while a valid non-teacher Supabase token returns `403`.
4. Complete a student crossword at `/` and confirm the city and submission appear in `/admin` and its CSV export.

Run the endpoint tests with `npm test`.
