# Data and API Sources

| Resource | Purpose | URL/version | License/terms | Access date | Shipped status |
|---|---|---|---|---|---|
| Synthetic MusimAman market dataset | Rice/corn/chili demo price context | `backend/src/mocks/market-prices.json`, version 1 | Project-owned synthetic data | 2026-07-16 | Shipped as `mock`; never labelled live |
| Groq Structured Outputs | Contextual explanation | https://console.groq.com/docs/structured-outputs | Groq provider terms | 2026-07-16 | Optional; strict JSON Schema with `openai/gpt-oss-20b` |
| Groq rate limits | 429 handling | https://console.groq.com/docs/rate-limits | Groq provider terms | 2026-07-16 | `retry-after` respected; no same-request 429 retry |
| Supabase Auth/PostgreSQL/RLS | Authentication and owner-only persistence | https://supabase.com/docs/guides/database/postgres/row-level-security | Supabase terms and PostgreSQL license | 2026-07-16 | Shipped |
| npm dependencies | Backend runtime and tests | `pnpm-lock.yaml` | Individual package licenses | 2026-07-16 | Shipped |

No live market-price provider is enabled. A verified provider may only be activated after its dataset URL, unit, grade, regional coverage, update schedule, and terms are recorded here.