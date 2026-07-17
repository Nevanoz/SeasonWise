# MusimAman Backend

Standalone Fastify backend for Supabase Auth/RLS plan persistence, synthetic market-price context, and guarded Groq explanations.

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and fill the Supabase values.
2. Install dependencies from the repository root with `pnpm install`.
3. Start the API with `pnpm dev:backend`.
4. Open health at `http://localhost:4000/api/v1/health` and API documentation at `http://localhost:4000/documentation`.

## Local Supabase

Supabase CLI is installed as a project dependency. Docker Desktop with WSL 2 must be running.

```powershell
pnpm --filter @musimaman/backend supabase:start
pnpm --filter @musimaman/backend supabase:reset
```

The reset command applies `backend/supabase/migrations` and `backend/supabase/seed.sql`.

Synthetic demo login:

- Email: `demo@musimaman.local`
- Password: `Demo123!ChangeMe`

Never use this account or password in production.

## Creating your own seeded plans

1. Create your local user through the app or Supabase Studio.
2. In Studio, open SQL Editor and run:

```sql
select id, email from auth.users order by created_at desc;
```

3. Copy your user UUID.
4. Duplicate the demo plan block in `supabase/seed.sql`.
5. Give the duplicated plan, crop, item, financing, scenario, and snapshot rows new UUIDs.
6. Replace `owner_id` with your user UUID and adjust only input assumptions first.
7. Recompute any calculation snapshots with the shared financial engine before committing them. Do not hand-edit displayed output values.
8. Run `pnpm --filter @musimaman/backend supabase:reset` again.

For a quick local-only option, the comments at the top of `seed.sql` explain how to attach the bundled demo directly to your existing user UUID.

## Verification

```powershell
pnpm --filter @musimaman/backend typecheck
pnpm --filter @musimaman/backend test
pnpm --filter @musimaman/backend build
```

The live two-user RLS suite runs when `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, and `SUPABASE_TEST_SERVICE_ROLE_KEY` are present. CI supplies these from the local Supabase stack.

## Groq

`openai/gpt-oss-20b` uses strict Structured Outputs with all fields required and `additionalProperties: false`. Responses are still Zod-validated and checked for invented numbers and unauthorized sections. Missing keys, timeouts, 429s, outages, or invalid output fall back to deterministic templates.