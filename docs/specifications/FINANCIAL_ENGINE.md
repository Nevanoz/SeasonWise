# MusimAman — Financial Engine

## 1. Contract dan invariants

`@musimaman/financial-engine` adalah pure TypeScript package. Ia tidak membaca database, network, environment variable, locale, atau current clock. Semua input eksplisit; hasil yang sama harus selalu menghasilkan output byte-equivalent setelah canonical serialization.

Invariants:

- Semua rupiah adalah non-negative safe integers pada input.
- Internal currency arithmetic tetap integer rupiah.
- Rate disimpan sebagai integer basis points: `1200` = 12.00%.
- Date adalah ISO `YYYY-MM-DD`; aggregation menggunakan calendar month `YYYY-MM`.
- Financing inflow dipisah dari operating income.
- AI dan UI tidak boleh mengganti hasil.
- Invalid input melempar typed `EngineValidationError`; engine tidak silently coerce.

```ts
type Rupiah = number;
type BasisPoints = number;
type YearMonth = `${number}-${string}`;

interface CalculationInput {
  schemaVersion: 1;
  engineVersion: "1.0.0";
  planStartDate: string;
  planEndDate: string;
  openingBalanceRupiah: Rupiah;
  emergencyReserveRupiah: Rupiah;
  monthlyHouseholdExpenseRupiah: Rupiah;
  cashFlowItems: CashFlowItem[];
  financingOption: FinancingOptionInput;
}
```

## 2. Supported financing strategies

MVP:

- `FLAT_MONTHLY`
- `BULLET`

Strategy registry disiapkan untuk:

- `EFFECTIVE_MONTHLY`
- `ANNUITY`
- `PRINCIPAL_GRACE`
- `FULL_GRACE`
- `INTEREST_ONLY`

Unsupported strategy harus menghasilkan `UNSUPPORTED_REPAYMENT_STRUCTURE`, bukan approximation.

```ts
interface FinancingOptionInput {
  id: string;
  name: string;
  principalRupiah: Rupiah;
  interestRateBps: BasisPoints;
  interestPeriod: "MONTHLY" | "ANNUAL";
  administrationFeeRupiah: Rupiah;
  otherUpfrontFeesRupiah: Rupiah;
  financingStartDate: string;
  gracePeriodMonths: number; // MVP 0; retained for future strategies
  numberOfInstallments: number;
  repaymentFrequency: "MONTHLY" | "ONCE";
  repaymentStructure: "FLAT_MONTHLY" | "BULLET";
  firstRepaymentDate: string;
}
```

## 3. Rate normalization

```ts
rateDecimal = interestRateBps / 10_000
monthlyRate = interestPeriod === "MONTHLY"
  ? rateDecimal
  : rateDecimal / 12
```

Rate normalization memakai JavaScript number hanya untuk rate multiplication. Hasil currency segera dibulatkan dengan satu fungsi canonical:

```ts
roundRupiah(x) = Math.round(x)
```

Asumsi prototype: annual flat rate diprorata per bulan; tidak menghitung compounding, day count, pajak, atau changing balance. UI wajib menampilkan asumsi ini.

## 4. Financing schedule

### 4.1 Disbursement dan fees

Pada `financingStartDate`:

- `financingInflow = principalRupiah`;
- `financingFeeOutflow = administrationFeeRupiah + otherUpfrontFeesRupiah`.

Dengan demikian user dapat melihat principal penuh dan biaya upfront terpisah. Jika provider memotong biaya dari pencairan, future template dapat merepresentasikan net disbursement, tetapi MVP tidak boleh mengubah asumsi diam-diam.

### 4.2 Flat monthly

```text
periodCount = numberOfInstallments
totalInterest = roundRupiah(principal × monthlyRate × periodCount)
totalRepayment = principal + totalInterest
baseInstallment = floor(totalRepayment / periodCount)
remainder = totalRepayment mod periodCount
```

Untuk menjaga exact total, installment ke-1 sampai ke-`remainder` memperoleh tambahan Rp1. Payment dates dimulai dari `firstRepaymentDate` dan maju satu calendar month sambil mempertahankan day-of-month sebisa mungkin; jika tanggal tidak ada, gunakan last valid day.

`gracePeriodMonths` harus `0` untuk MVP flat strategy. Future implementation dapat menghasilkan interest accrual selama grace hanya setelah assumptions disetujui.

### 4.3 Bullet

```text
monthsOutstanding =
  countCalendarMonths(financingStartDate, firstRepaymentDate)
interestPeriods =
  interestPeriod === "MONTHLY"
    ? max(1, monthsOutstanding)
    : max(1, monthsOutstanding) / 12
totalInterest = roundRupiah(principal × rateDecimal × interestPeriods)
bulletPayment = principal + totalInterest
```

Satu payment berada pada `firstRepaymentDate`. Untuk bullet kurang dari satu bulan, prototype memakai minimum satu monthly period bila rate bulanan. Assumption ini wajib terlihat; produk nyata mungkin memakai day count yang berbeda.

### 4.4 Totals

```text
totalFinancingPayment = sum(required repayments)
totalFees = administrationFee + otherUpfrontFees
totalFinancingCost = totalInterest + totalFees
```

Financing principal bukan operating income dan tidak masuk denominator repayment-to-income.

## 5. Monthly ledger

Horizon mencakup setiap calendar month dari `planStartDate` sampai `planEndDate`, inclusive. Plan end wajib mencakup last repayment dan seluruh scenario-shifted harvest dates.

Urutan per month:

```text
opening month:
  prior running balance
  + opening balance (first month only)
  + emergency reserve (first month only)
  + operating income
  + financing inflow
  - production expenses
  - household minimum expense
  - financing fees
  - required financing payments
= running balance
```

Household expense diterapkan sekali setiap month dalam horizon, termasuk first dan last month.

```ts
interface MonthlyCashFlow {
  month: YearMonth;
  operatingIncomeRupiah: Rupiah;
  harvestIncomeRupiah: Rupiah;
  nonFarmIncomeRupiah: Rupiah;
  financingInflowRupiah: Rupiah;
  productionExpenseRupiah: Rupiah;
  householdExpenseRupiah: Rupiah;
  financingFeeRupiah: Rupiah;
  financingPaymentRupiah: Rupiah;
  netCashFlowRupiah: number;
  runningBalanceRupiah: number;
  isCashGap: boolean;
}
```

## 6. Required metrics

```text
minimumBalance = min(month.runningBalance)
maximumCashGap = abs(min(0, minimumBalance))
firstCashGapMonth = first month where runningBalance < 0, else null
negativeCashFlowMonths = count(month.netCashFlow < 0)
endingBalance = last runningBalance
totalInterest = schedule total interest
totalFees = schedule fees
totalFinancingPayment = required repayments
totalFinancingCost = totalInterest + totalFees
repaymentToIncomeRatio =
  totalFinancingPayment / max(1, totalOperatingIncome)
```

`negativeCashFlowMonths` berbeda dari cash-gap months: net flow dapat negatif tetapi balance masih positif.

### Break-even harvest income

Definisi MVP:

> Total harvest income minimum yang membuat ending balance tepat tidak negatif, dengan seluruh timing dan non-harvest flows tetap.

Hitung ledger kedua dengan harvest income = 0:

```text
breakEvenHarvestIncome = max(0, -endingBalanceWithZeroHarvestIncome)
```

Angka ini tidak menjamin setiap pre-harvest month non-negative. Karena itu hasil juga memiliki:

```text
preHarvestLiquidityRequired =
  abs(min(0, minimum running balance before first harvest month))
```

UI wajib menyatakan bila higher harvest income tidak dapat memperbaiki gap yang terjadi sebelum panen; timing pembiayaan/reserve perlu ditinjau.

## 7. Scenario engine

Scenario tidak memodifikasi base input. Gunakan canonical deep clone dan ordered transforms:

1. `INPUT_COST_INCREASE`
2. `HARVEST_INCOME_REDUCTION`
3. `HARVEST_DELAY`

Urutan ini didokumentasikan dan testable; pada transform independen hasil seharusnya sama, tetapi fixed order mencegah ambiguity.

```ts
interface ScenarioConfig {
  mode: "EXPECTED" | "MILD" | "SEVERE" | "CUSTOM";
  harvestDelayMonths: number;
  harvestIncomeReductionBps: number;
  inputCostIncreaseBps: number;
  enabled: {
    harvestDelay: boolean;
    harvestIncomeReduction: boolean;
    inputCostIncrease: boolean;
  };
}
```

Defaults:

| Mode | Delay | Income reduction | Input increase |
|---|---:|---:|---:|
| Expected | 0 | 0% | 0% |
| Mild | 1 month | 10% | 10% |
| Severe | 2 months | 30% | 25% |
| Custom default | 1 month | 20% | 15% |

Prompt-required prototype values berada pada Custom defaults. Tidak ada probability.

Transform:

```text
delayedDate = addCalendarMonths(originalHarvestDate, delay)
reducedIncome = roundRupiah(originalHarvestIncome × (1 - reductionBps/10000))
increasedCost = roundRupiah(originalProductionCost × (1 + increaseBps/10000))
```

Only items with `isHarvestIncome` shift/reduce; only `production_expense` increases. Household expense dan non-farm income tidak berubah.

## 8. Comparison

Run the same normalized base plan and same scenario configs for option A and B. Comparison must return raw metrics and transparent `resilienceDelta`, not “recommended lender”.

Tie-breaking display rule:

1. fewer expected-scenario cash gaps;
2. lower worst-scenario maximum cash gap;
3. later first gap month;
4. higher worst-scenario ending balance;
5. lower total financing cost.

Wording: “Struktur A relatif lebih tahan dalam simulasi ini karena …”. Jika mixed outcomes, return `NO_CLEAR_ADVANTAGE`.

## 9. Prototype resilience assessment

Score starts at 100. Deductions are independent, displayed, configured in `packages/config/risk/prototype-1.ts`, and require expert validation after hackathon.

| Factor | Prototype deduction |
|---|---:|
| Expected scenario maximum cash gap > 0 | -35 |
| Any enabled stress creates/increases cash gap | -20 |
| Repayment-to-income 20–35% / 35–50% / >50% | -5 / -10 / -15 |
| Opening + reserve covers <1 / 1–<2 household months | -10 / -5 |
| Expected ending balance ≤0 / <1 household month | -10 / -5 |
| Financing cost >30% principal | -5 |
| Each major sensitivity creates a new gap | -5, capped -10 |

Clamp 0–100. Do not double-apply both ending-balance branches or reserve branches.

Categories:

- `75–100`: `RELATIVELY_RESILIENT`
- `50–74`: `NEEDS_ADJUSTMENT`
- `0–49`: `HIGH_CASH_FLOW_RISK`

Result:

```ts
interface RiskAssessment {
  score: number;
  category: "RELATIVELY_RESILIENT" | "NEEDS_ADJUSTMENT" | "HIGH_CASH_FLOW_RISK";
  configVersion: "prototype-1";
  factors: Array<{
    code: string;
    deduction: number;
    actualValue: number | string;
    threshold: number | string;
    explanationKey: string;
  }>;
  disclaimerRequired: true;
}
```

Setiap explanation harus menyebut angka dari `CashFlowResult`; jangan membuat confidence percentage.

## 10. Output

```ts
interface CashFlowResult {
  engineVersion: string;
  inputChecksum: string;
  monthly: MonthlyCashFlow[];
  minimumBalanceRupiah: number;
  maximumCashGapRupiah: number;
  firstCashGapMonth: YearMonth | null;
  totalFinancingPaymentRupiah: Rupiah;
  totalInterestRupiah: Rupiah;
  totalFeesRupiah: Rupiah;
  totalFinancingCostRupiah: Rupiah;
  breakEvenHarvestIncomeRupiah: Rupiah;
  preHarvestLiquidityRequiredRupiah: Rupiah;
  repaymentToIncomeRatioBps: number;
  negativeCashFlowMonths: number;
  endingBalanceRupiah: number;
  assumptions: string[];
  warnings: string[];
}
```

Ratio disimpan di output sebagai integer bps untuk stable display.

## 11. Validation errors

Reject:

- negative currency/rate;
- non-integer currency;
- values above `Number.MAX_SAFE_INTEGER`;
- invalid ISO date;
- end before start;
- item/payment outside horizon;
- harvest missing or after plan end;
- first repayment before financing start;
- incompatible frequency/structure;
- zero installments for monthly;
- non-zero grace in unsupported strategy.

## 12. Definition of Done

- Pure functions have no clock/network/storage.
- Exact unit cases in [TESTING_GUIDE.md](../guides/TESTING_GUIDE.md) pass.
- Web and API import the same built artifact.
- Demo result checksum is committed.
- All totals reconcile to monthly ledger.
- Installment remainder preserves exact rupiah total.
- Combined scenario never mutates base plan.
- Historical snapshot contains input, normalized input, result, engine version, and scenario config.
- Numeric UI and AI context originate from this output only.
