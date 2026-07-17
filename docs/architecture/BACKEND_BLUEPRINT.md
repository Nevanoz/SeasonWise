# MusimAman — Backend Blueprint

## 1. Objective dan keputusan

Backend adalah secure gateway untuk secrets, external data, AI, authenticated plan operations, cache, dan optional calculation verification. Core calculation tetap berjalan di browser melalui shared package.

Gunakan Fastify, TypeScript, Zod, Supabase, Pino structured logging bawaan Fastify, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/swagger`, dan `@fastify/swagger-ui`. Deploy utama ke Railway karena Fastify dapat berjalan sebagai Node service tanpa mengubah lifecycle menjadi serverless; bind `host: "::"`.

## 2. Target runtime structure

```text
src/
├── server.ts
├── app.ts
├── env.ts
├── routes/
│   ├── health.ts
│   ├── plans.ts
│   ├── market-prices.ts
│   └── chat.ts
├── services/
│   ├── plan-service.ts
│   ├── external-data-service.ts
│   └── chat-service.ts
├── providers/
│   ├── market-price-provider.ts
│   └── mock-providers.ts
├── plugins/
│   ├── auth.ts
│   ├── cors.ts
│   ├── errors.ts
│   ├── rate-limit.ts
│   ├── request-id.ts
│   └── supabase.ts
└── mocks/
    └── market-prices.json
```

## 3. Request lifecycle

1. Add/generate `requestId`.
2. Apply CORS, security headers, body-size limit.
3. Route-level rate limit.
4. Parse and Zod-validate params/query/body.
5. Verify Supabase JWT only for protected endpoints.
6. Execute service with timeout/abort signal.
7. Validate response DTO.
8. Log status, latency, provider status, not financial payload.
9. Central error handler returns stable envelope.

Error envelope:

```ts
interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Array<{ path: string; message: string }>;
  };
}
```

Never include stack, secrets, raw provider response, user financial values, or prompt in production error output.

## 4. Auth dan persistence

- Web obtains Supabase access token.
- API verifies JWT using Supabase/JWKS-supported client, then sets `request.userId`.
- Plan queries must include `owner_id = userId`; RLS remains active as defense in depth.
- Prefer user-scoped Supabase client for CRUD. Service-role key is restricted to server-only maintenance/provider cache operations and must never bypass ownership for plan CRUD.
- Guest calculation, scenario, and comparison do not require API; public verification endpoints may be rate limited and accept no persistent write.

## 5. External provider contracts

```ts
interface ProviderMetadata {
  source: string;
  dataDate: string | null;
  lastCheckedAt: string;
  region: string;
  status: "live" | "cached" | "mock" | "unavailable";
  rawReferenceId?: string;
  attributionUrl?: string;
}

interface MarketPriceProvider {
  getCommodityPrice(input: CommodityPriceQuery): Promise<CommodityPriceContext>;
}
```

### Market-price flow

No undocumented scraping. At hackathon start, record:

- provider URL and license/terms;
- direct API/download method;
- commodities and producer/consumer price level;
- region coverage;
- unit and grade;
- update schedule.

Only enable live provider when those checks pass. Normalize to `IDR_PER_KG` where conversion is defensible. For palm oil/coffee grades that cannot be normalized safely, retain source unit and prevent direct autofill. Cached snapshot TTL 24 hours or provider update cadence, whichever is longer. Fallback JSON must contain `status: "mock"` and `synthetic: true`.

## 6. AI gateway

API builds allowlisted `ChatContext`; raw plan notes, receipt text, email, and identifiers are excluded. Maximum user message 1,200 chars; context JSON size target <12 KB; timeout 8 seconds; one schema retry; per-user/IP limit 5/minute.

Use Groq strict Structured Outputs for the documented default `openai/gpt-oss-20b`, with all properties required and `additionalProperties: false`; validate again with Zod. The Chat Completions API currently does not support the `store` parameter, so it is omitted. If provider fails, use `explainResultWithTemplate()`.

See [AI_INTEGRATION.md](../specifications/AI_INTEGRATION.md).

## 7. Security baseline

- CORS allowlist: production web origin and explicit localhost.
- `Content-Type: application/json`; request body max 100 KB; chat max 20 KB.
- Security headers through `@fastify/helmet`.
- Rate limits: public calculate 30/min/IP; market price 20/min/IP; chat 5/min/user or IP; auth/plan 60/min/user.
- Validate environment at startup; fail closed if production origins or Supabase keys missing.
- No `eval`, no user-supplied JSON Schema, no raw HTML.
- Sanitize log fields; never log request body for plan/chat routes.
- Provider responses are untrusted and Zod-validated.
- AI text rendered as plain text.
- Delete account/plan endpoints require fresh authenticated session and explicit confirmation.

## 8. Caching

MVP cache priority:

1. `external_data_snapshots` in Supabase for normalized cache.
2. In-memory LRU for five-minute hot cache.
3. Versioned repo mock JSON.

Cache key includes provider, region, commodity, unit, and query version. Store raw reference id but avoid full raw response unless needed and licensed. Stale data remains visible with `cached` and `stale: true`; it never becomes `live`.

## 9. Logging

Log:

- requestId, route, method, status, latency;
- userId hashed/truncated when necessary;
- provider name/status/latency;
- engine version and result checksum, not inputs/results;
- AI model, token counts when available, refusal/fallback reason.

Do not log:

- principal, income, expense, balance;
- user messages or AI answers;
- JWT, email, API keys;
- full external response.

## 10. Main tasks

### API foundation

- **Objective:** secure typed REST service.
- **Priority/owner:** P0, backend.
- **Inputs:** shared Zod schemas, env.
- **Output:** health, OpenAPI, error envelope, logging.
- **Dependencies:** package contracts.
- **Acceptance/DoD:** startup env validation; `/health` reports dependencies separately; malformed request returns 422; secrets absent from logs.
- **Risk:** plugin setup delay.
- **Fallback:** health + route-local Zod, Swagger JSON only.

### Plan persistence

- **Objective:** owner-only CRUD and local migration.
- **Priority/owner:** P0, both.
- **Dependencies:** Supabase migration/RLS/auth.
- **Acceptance/DoD:** unauthorized 401; other owner’s id returns 404; CRUD/duplicate/delete pass.
- **Risk:** RLS/service role misuse.
- **Fallback:** direct authenticated Supabase client with RLS; API remains for AI/data.

### External adapters

- **Objective:** stable normalized context.
- **Priority/owner:** P0, backend/data.
- **Dependencies:** verified region mapping and source register.
- **Acceptance/DoD:** all four statuses tested; calculator unaffected by failure.
- **Risk:** provider changes.
- **Fallback:** dated mock adapters.

### AI gateway

- **Objective:** scoped explanation only.
- **Priority/owner:** P0, backend/AI.
- **Dependencies:** validated engine output.
- **Acceptance/DoD:** structured response, injection/out-of-scope refusal, numeric verification/template fallback.
- **Risk:** timeout/hallucination.
- **Fallback:** deterministic template service.

## 11. Health response

```json
{
  "status": "degraded",
  "version": "1.0.0",
  "engineVersion": "1.0.0",
  "checks": {
    "api": "ok",
    "supabase": "ok",
    "marketPrice": "mock",
    "groq": "unknown"
  },
  "timestamp": "2026-07-16T12:00:00.000Z"
}
```

`degraded` tetap HTTP 200 bila core API/engine bekerja; `unhealthy` HTTP 503 hanya bila API core tidak dapat melayani.
