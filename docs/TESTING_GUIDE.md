# MusimAman — Testing Guide

## 1. Test gates

P0 release gates:

1. Financial engine unit suite passes with exact integer outputs.
2. Shared validation suite passes in web and API.
3. Supabase RLS ownership tests pass.
4. Critical flow passes in Playwright or exact manual script.
5. Production smoke test passes with external APIs disabled.

Use Vitest for packages/web/API and Playwright for E2E. Freeze timezone to `Asia/Jakarta` only for display tests; engine uses ISO calendar dates without runtime timezone conversion.

## 2. Financial-engine exact cases

Common minimal horizon is January–April 2026; household expense is zero unless specified.

| Case | Input | Expected output | Reason |
|---|---|---|---|
| No interest | principal 1,200,000; 0 bps; 3 monthly installments | interest 0; payments 400,000 ×3; total 1,200,000 | Base schedule |
| Flat interest | principal 12,000,000; 100 bps monthly; 4 installments | interest 480,000; total 12,480,000; each 3,120,000 | `P × r × n` |
| Annual normalization | same principal; 1200 bps annual; 4 installments | identical to prior case | 12% annual → 1% monthly |
| Remainder | principal 1,000; 0%; 3 installments | 334, 333, 333; sum 1,000 | Preserve integer total |
| Upfront fees | principal 10,000,000; admin 100,000; other 50,000 | financing inflow 10,000,000; first-month fee outflow 150,000; total fees 150,000 | Fees visible, not netted silently |
| Bullet | principal 10,000,000; 1200 bps annual; 4 months | interest 400,000; one payment 10,400,000 | Annual flat prorata |
| Monthly bullet minimum | principal 1,000,000; 100 bps monthly; repayment <1 calendar month | interest 10,000 | Minimum one monthly period assumption |
| Multiple incomes | two entries 1,000,000 and 500,000 same month | monthly operating income 1,500,000 | Aggregation |
| Multiple costs | costs 250,000 and 750,000 same month | production expense 1,000,000 | Aggregation |
| Monthly household | 500,000 over four inclusive months | household total 2,000,000 | One occurrence per calendar month |
| Zero opening | no inflows; expense 100,000 | first running balance -100,000; gap 100,000 | Gap definition |
| Positive opening | opening 500,000; expense 100,000 | running 400,000 | Opening balance contribution |
| Emergency reserve | opening 0; reserve 300,000; expense 100,000 | running 200,000 | Reserve contribution |
| Exact zero | opening 1,000,000; one expense 1,000,000 | running 0; no cash gap | Gap is `<0`, not `<=0` |
| Negative balance | opening 100,000; expense 350,000 | minimum -250,000; max gap 250,000 | Metric sign |
| Negative-flow month | opening 1,000,000; expense 200,000 | net flow -200,000; balance positive; negative-flow months 1; no gap | Distinguish flow/gap |
| Large rupiah | principal 1,000,000,000,000; 0%; one payment | exact total 1,000,000,000,000 | Safe large integer |
| Unsafe integer | amount > `Number.MAX_SAFE_INTEGER` | `CURRENCY_OUT_OF_RANGE` | Prevent precision loss |
| Non-integer rupiah | amount 1000.5 | validation error | No fractional stored currency |

### Scenario cases

| Case | Base | Scenario | Expected |
|---|---|---|---|
| Delayed harvest | harvest 10,000,000 on 2026-10-15 | delay 1 month | same amount on 2026-11-15; original unchanged |
| Reduced income | harvest 10,000,000 | 20% / 2000 bps | 8,000,000 |
| Increased input | production cost 1,000,000 | 15% / 1500 bps | 1,150,000 |
| Combined | same three values | delay 1, reduce 20%, increase 15% | harvest 8,000,000 in Nov; cost 1,150,000; base unchanged |
| Non-farm unchanged | non-farm income 2,000,000 | reduce harvest 20% | remains 2,000,000 |
| Household unchanged | household 500,000/month | input increase 15% | remains 500,000/month |
| Scenario horizon | harvest shifted beyond plan end | delay | validation returns `SCENARIO_OUTSIDE_HORIZON` or normalized horizon explicitly extended by caller | No silent omission |

### Break-even and ratios

1. With zero-harvest ending balance `-6,000,000`, expected `breakEvenHarvestIncomeRupiah = 6,000,000`.
2. If a `-1,000,000` gap occurs before first harvest but final balance becomes positive, expected `preHarvestLiquidityRequiredRupiah = 1,000,000`; break-even does not claim to solve timing gap.
3. Financing payments 3,000,000 and operating income 10,000,000 produce `repaymentToIncomeRatioBps = 3000`.
4. Zero operating income uses protected denominator and emits `NO_OPERATING_INCOME_FOR_RATIO` warning; it must not return Infinity/NaN.

### Dates and invalid inputs

- invalid ISO dates (`2026-02-30`, localized strings) rejected;
- harvest before planting rejected;
- first repayment before financing start rejected;
- item outside plan horizon rejected;
- missing harvest income rejected;
- `FLAT_MONTHLY` + `ONCE` rejected;
- `BULLET` + installments >1 rejected;
- negative amount/rate/fees/scenario percentage rejected;
- reduction >100% rejected;
- unsupported grace period rejected;
- unsupported repayment strategy rejected.

### Future strategy architecture

Registering a mock strategy must not alter existing strategy results. `EFFECTIVE_MONTHLY`, `ANNUITY`, and grace structures return typed unsupported errors until implemented and separately tested.

## 3. Reconciliation/property tests

For generated valid inputs:

- sum scheduled repayments = `totalFinancingPayment`;
- `totalFinancingCost = totalInterest + totalFees`;
- each monthly balance = prior balance + current net flow, with first-month initial funds;
- `maximumCashGap = abs(min(0, minimumBalance))`;
- base input deep-equals original after any scenario run;
- identical normalized input produces identical checksum/result;
- all outputs contain finite safe integers;
- comparison runs both options against identical non-financing inputs.

## 4. Risk-assessment tests

- score starts at 100 and clamps 0–100;
- exact expected gap applies -35 once;
- stress gap applies configured deduction once;
- exclusive ratio/reserve/ending tiers do not double count;
- thresholds 75 and 50 map to correct categories;
- every deduction has actual value, threshold, code, and explanation key;
- configuration version is present;
- no statistical confidence field exists.

## 5. Frontend tests

### Unit/component

- each crop template populates editable dates/phases;
- rupiah parser converts display text to integer;
- rate requires monthly/annual selection;
- invalid dates and negative values show linked messages;
- repeatable income/cost add/edit/delete;
- demo button loads synthetic seed and label;
- scenario toggles update result and combined scenario;
- comparison table maps exact engine values;
- status is understandable without color;
- local plan reload and corrupt-data quarantine;
- cloud migration requires consent;
- external panel shows source/status/timestamps;
- Groq failure shows template;
- print excludes navigation/PII and includes disclaimer/version.

### Responsive/accessibility

- 320, 390, 768, 1280 px screenshots;
- no horizontal overflow except data table with labeled scroll container;
- keyboard-only complete wizard;
- focus management after step/errors;
- automated axe checks plus manual screen-reader labels;
- 200% zoom usable;
- reduced motion respected.

## 6. Backend tests

- invalid request → 422 stable error envelope;
- missing/invalid JWT → 401;
- user A cannot read/update/delete user B plan → 404;
- RLS blocks cross-owner direct query;
- optimistic version conflict → 409;
- request body not present in logs;
- CORS rejects unknown production origin;
- rate limit returns 429 and retry metadata;
- market-price timeout → cached/mock/unavailable envelope;
- malformed market-price payload rejected;
- stale cache never labeled live;
- price unit mismatch sets `canAutofill=false`;
- Groq malformed JSON → retry/template;
- out-of-scope/injection → refusal;
- Groq numeric invention → template;
- missing secret fails production startup;
- health is degraded, not dead, when external enrichments fail.

## 7. Critical Playwright flow

```ts
test("rice demo remains understandable under delayed harvest", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /coba demo/i }).click();
  await expect(page.getByText(/data sintetis/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /rencana padi/i })).toBeVisible();
  await page.getByRole("button", { name: /lihat hasil/i }).click();
  await expect(page.getByText(/saldo terendah/i)).toBeVisible();
  await page.getByLabel(/panen terlambat/i).check();
  await page.getByLabel(/jumlah keterlambatan/i).fill("1");
  await expect(page.getByText(/kekurangan kas/i)).toBeVisible();
  await page.getByRole("link", { name: /bandingkan pembiayaan/i }).click();
  await expect(page.getByText(/pembayaran pascapanen/i)).toBeVisible();
  await page.getByRole("button", { name: /simpan/i }).click();
  // Sign-in or guest local-save path is selected by fixture.
  await page.reload();
  await expect(page.getByText(/rencana padi/i)).toBeVisible();
  await page.getByRole("button", { name: /tanya musimaman/i }).click();
  await page.getByRole("textbox", { name: /pertanyaan/i })
    .fill("Mengapa gap terjadi?");
  await page.getByRole("button", { name: /kirim/i }).click();
  await expect(page.getByText(/simulasi/i)).toBeVisible();
  await page.getByRole("link", { name: /laporan/i }).click();
  await expect(page.getByText(/alat bantu diskusi/i)).toBeVisible();
});
```

Run this in normal mode and with API routes mocked unavailable.

## 8. Exact manual fallback script

1. Open production URL in private mobile-width window.
2. Click **Coba Demo** and verify synthetic label.
3. Confirm crop rice, four-month cycle, production costs, household cost, harvest income, and two financing options.
4. Open expected result; record checksum and minimum balance.
5. Enable one-month delay; verify harvest moves one month and visible gap appears.
6. Enable income reduction and cost increase together; verify all three chips active.
7. Compare monthly and bullet; verify same base assumptions.
8. Save guest plan; reload and reopen.
9. Sign up/in; consent to migrate; update, duplicate, delete.
10. Ask relevant chat question; verify disclaimer.
11. Ask unrelated/injection question; verify refusal.
12. Disable network; verify local calculation/save/print.
13. Restore network; verify external source statuses.
14. Open print preview; verify no email/phone and required sections.
15. Repeat core path at 320 px and keyboard-only.

Record tester, browser, build commit, timestamp, pass/fail, and screenshot for failures.

## 9. Demo snapshot audit

Before freeze:

- generate seed result through engine;
- independently recompute payment totals in a spreadsheet/calculator;
- commit input checksum and expected result fixture;
- two team members review formulas and displayed labels;
- reject any demo result that depends on Groq or live external data.
