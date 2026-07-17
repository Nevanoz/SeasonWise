# MusimAman — API Documentation

Base URL: `/api/v1`  
Content type: `application/json`  
Authentication: `Authorization: Bearer <Supabase access token>` pada protected routes.  
Money in JSON: integer rupiah selama ≤ JavaScript safe integer. Database `bigint` serialization must be checked.

## 1. Common envelopes

```ts
interface Success<T> {
  data: T;
  meta: { requestId: string; timestamp: string };
}

interface Failure {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Array<{ path: string; message: string }>;
  };
}
```

Status: 400 malformed JSON, 401 unauthenticated, 403 forbidden, 404 not found/other owner, 409 version conflict, 422 validation, 429 rate limit, 502 provider error without fallback, 503 dependency unavailable.

## 2. Endpoint matrix

| Method | Path | Purpose | Auth | Limit |
|---|---|---|---|---:|
| GET | `/health` | Health/dependency status | No | 60/min |
| GET | `/auth/session` | Validate current Supabase session | Yes | 60/min |
| GET | `/plans` | List own plans | Yes | 60/min |
| POST | `/plans` | Create/migrate a plan | Yes | 30/min |
| GET | `/plans/:id` | Read own plan | Yes | 60/min |
| PUT | `/plans/:id` | Replace own plan | Yes | 30/min |
| POST | `/plans/:id/duplicate` | Duplicate own plan | Yes | 10/min |
| DELETE | `/plans/:id` | Soft delete own plan | Yes | 10/min |
| POST | `/calculate` | Verify shared-engine result | Optional | 30/min/IP |
| POST | `/scenarios` | Run scenario set | Optional | 30/min/IP |
| POST | `/compare` | Compare two options | Optional | 30/min/IP |
| GET | `/market-prices` | Price reference/fallback | No | 20/min/IP |
| POST | `/chat` | Scoped Groq/template answer | Optional | 5/min |

OpenAPI JSON: `/documentation/json`; Swagger UI may be disabled in production if exposure is undesirable.

## 3. Plans

### `POST /plans`

Creates a cloud plan or migrates a guest plan. Body is `PlanInput` plus optional snapshot.

```json
{
  "plan": {
    "schemaVersion": 1,
    "title": "Musim Padi Juli",
    "region": {
      "provinceCode": "32",
      "regencyCode": "32.04",
      "districtCode": null
    },
    "cropPlan": {
      "cropType": "rice",
      "plantingDate": "2026-07-20",
      "estimatedHarvestDate": "2026-11-20",
      "cycleDurationDays": 123,
      "expectedHarvestQuantity": 3000,
      "quantityUnit": "kg",
      "expectedSellingPriceRupiah": 6500
    },
    "cashFlowItems": [],
    "monthlyHouseholdExpenseRupiah": 1500000,
    "openingBalanceRupiah": 1000000,
    "emergencyReserveRupiah": 500000,
    "financingOptions": []
  },
  "source": "guest_migration"
}
```

Response 201:

```json
{
  "data": {
    "id": "89e2e790-0000-4000-8000-000000000001",
    "updatedAt": "2026-07-16T12:00:00.000Z",
    "schemaVersion": 1
  },
  "meta": {
    "requestId": "req_01",
    "timestamp": "2026-07-16T12:00:00.000Z"
  }
}
```

Validation: all currency integers ≥0; title 1–100; supported crop; valid dates; max two financing options for MVP. User id comes from token, never request body.

### `GET /plans?cursor=&limit=20`

Returns own non-deleted plans; limit 1–50. Cursor is opaque.

### `GET /plans/:id`

Returns normalized editable plan and latest optional snapshot. Another owner’s UUID returns 404 to avoid enumeration.

### `PUT /plans/:id`

Full replacement with `expectedUpdatedAt` for optimistic concurrency.

```json
{
  "expectedUpdatedAt": "2026-07-16T12:00:00.000Z",
  "plan": {}
}
```

Returns 409 `PLAN_VERSION_CONFLICT` if stale.

### `POST /plans/:id/duplicate`

Body `{ "title": "Salinan Musim Padi Juli" }`; creates new owned rows, no copied immutable report metadata.

### `DELETE /plans/:id`

Body `{ "confirm": true }`; sets `deleted_at`.

## 4. Calculate

### `POST /calculate`

The browser does not require this endpoint. It verifies result or creates authenticated snapshot when `saveSnapshot=true`.

```json
{
  "input": {
    "schemaVersion": 1,
    "engineVersion": "1.0.0",
    "planStartDate": "2026-07-01",
    "planEndDate": "2026-12-31",
    "openingBalanceRupiah": 1000000,
    "emergencyReserveRupiah": 500000,
    "monthlyHouseholdExpenseRupiah": 1500000,
    "cashFlowItems": [],
    "financingOption": {}
  },
  "scenario": {
    "mode": "EXPECTED",
    "harvestDelayMonths": 0,
    "harvestIncomeReductionBps": 0,
    "inputCostIncreaseBps": 0,
    "enabled": {
      "harvestDelay": false,
      "harvestIncomeReduction": false,
      "inputCostIncrease": false
    }
  },
  "planId": null,
  "saveSnapshot": false
}
```

Response:

```json
{
  "data": {
    "result": {
      "engineVersion": "1.0.0",
      "inputChecksum": "sha256:...",
      "monthly": [],
      "minimumBalanceRupiah": 250000,
      "maximumCashGapRupiah": 0,
      "firstCashGapMonth": null,
      "totalFinancingPaymentRupiah": 11200000,
      "totalInterestRupiah": 1200000,
      "totalFeesRupiah": 100000,
      "totalFinancingCostRupiah": 1300000,
      "breakEvenHarvestIncomeRupiah": 0,
      "preHarvestLiquidityRequiredRupiah": 0,
      "repaymentToIncomeRatioBps": 3200,
      "negativeCashFlowMonths": 3,
      "endingBalanceRupiah": 3000000
    },
    "assessment": {
      "score": 80,
      "category": "RELATIVELY_RESILIENT",
      "configVersion": "prototype-1",
      "factors": []
    }
  },
  "meta": { "requestId": "req_02", "timestamp": "2026-07-16T12:00:00.000Z" }
}
```

Example numbers are schema illustrations, not demo guarantees; actual seed snapshot must be generated by the engine.

## 5. Scenarios

### `POST /scenarios`

Body:

```json
{
  "input": {},
  "scenarios": [
    {
      "id": "delayed-1",
      "mode": "CUSTOM",
      "harvestDelayMonths": 1,
      "harvestIncomeReductionBps": 0,
      "inputCostIncreaseBps": 0,
      "enabled": {
        "harvestDelay": true,
        "harvestIncomeReduction": false,
        "inputCostIncrease": false
      }
    }
  ]
}
```

Maximum 8 scenarios/request. Response has base result plus ordered scenario results, each with transformed-input checksum and no probability.

## 6. Compare

### `POST /compare`

```json
{
  "basePlan": {},
  "financingOptions": [{}, {}],
  "scenarios": [{ "mode": "EXPECTED" }, { "mode": "CUSTOM" }]
}
```

Exactly two options. Response:

```json
{
  "data": {
    "options": [
      { "optionId": "monthly", "expected": {}, "scenarios": [] },
      { "optionId": "bullet", "expected": {}, "scenarios": [] }
    ],
    "outcome": "OPTION_B_MORE_RESILIENT",
    "reasonCodes": [
      "LOWER_WORST_SCENARIO_GAP",
      "FEWER_NEGATIVE_MONTHS"
    ],
    "disclaimerRequired": true
  },
  "meta": { "requestId": "req_03", "timestamp": "2026-07-16T12:00:00.000Z" }
}
```

No lender or product recommendation.

## 7. Market prices

### `GET /market-prices?commodity=rice&provinceCode=32&unit=IDR_PER_KG`

Response:

```json
{
  "data": {
    "commodity": "rice",
    "region": "Jawa Barat",
    "unit": "IDR_PER_KG",
    "priceRupiah": 6500,
    "rangeRupiah": { "low": 6200, "high": 6800 },
    "source": "Synthetic MusimAman demo dataset",
    "dataDate": "2026-07-01",
    "lastCheckedAt": "2026-07-16T12:00:00.000Z",
    "status": "mock",
    "synthetic": true,
    "canAutofill": true
  },
  "meta": { "requestId": "req_05", "timestamp": "2026-07-16T12:00:00.000Z" }
}
```

Mock values must be stored in repo and clearly synthetic. `canAutofill=false` if unit/grade cannot be normalized.

## 8. Chat

### `POST /chat`

```json
{
  "message": "Mengapa ada kekurangan kas setelah panen terlambat?",
  "context": {
    "page": "results",
    "cropPlanSummary": {},
    "financingSummary": {},
    "expectedResult": {},
    "scenarioResults": [],
    "comparisonResult": null,
    "externalDataSummary": null,
    "allowedKnowledgeSections": ["cash_gap", "scenario", "disclaimer"]
  },
  "locale": "id-ID"
}
```

Response:

```json
{
  "data": {
    "answer": "Pada simulasi keterlambatan, pendapatan panen masuk setelah kewajiban pembayaran...",
    "referencedSections": ["cash_gap", "scenario"],
    "disclaimerRequired": true,
    "responseMode": "groq"
  },
  "meta": { "requestId": "req_06", "timestamp": "2026-07-16T12:00:00.000Z" }
}
```

`responseMode` may be `groq`, `template`, or `refusal`. Guest request is allowed but does not persist context/history.

## 9. Fallback rules

- `/calculate`, `/scenarios`, `/compare`: frontend uses local engine if API unavailable.
- `/market-prices`: stale cache → mock → unavailable.
- `/chat`: deterministic template.
- `/plans`: local guest repository; cloud action queues only after explicit user retry, not background sync.
