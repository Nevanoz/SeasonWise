/**
 * @musimaman/financial-engine
 *
 * Pure deterministic financial calculation engine.
 * NO clock, NO network, NO database, NO locale, NO environment variables.
 * Identical input always produces identical output.
 */

import type {
  CalculationInput,
  CashFlowItem,
  CashFlowResult,
  FinancingOptionInput,
  MonthlyCashFlow,
  RiskAssessment,
  RiskFactor,
  ScenarioConfig,
} from "@musimaman/shared-types";
import { RISK_CONFIG, ENGINE_VERSION } from "@musimaman/config";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export type Rupiah = number;
export type BasisPoints = number;

export interface ScheduledPayment {
  date: string; // YYYY-MM-DD
  principalRupiah: Rupiah;
  interestRupiah: Rupiah;
  totalRupiah: Rupiah;
}

export interface FinancingSchedule {
  disbursementDate: string;
  financingInflowRupiah: Rupiah;
  financingFeeOutflowRupiah: Rupiah;
  payments: ScheduledPayment[];
  totalInterestRupiah: Rupiah;
  totalFeesRupiah: Rupiah;
  totalFinancingPaymentRupiah: Rupiah;
}

// ---------------------------------------------------------------------------
// Typed error
// ---------------------------------------------------------------------------

export class EngineValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "EngineValidationError";
  }
}

// ---------------------------------------------------------------------------
// Scenario defaults
// ---------------------------------------------------------------------------

export const SCENARIO_DEFAULTS: Record<ScenarioConfig["mode"], ScenarioConfig> = {
  EXPECTED: {
    mode: "EXPECTED",
    harvestDelayMonths: 0,
    harvestIncomeReductionBps: 0,
    inputCostIncreaseBps: 0,
    enabled: { harvestDelay: false, harvestIncomeReduction: false, inputCostIncrease: false },
  },
  MILD: {
    mode: "MILD",
    harvestDelayMonths: 1,
    harvestIncomeReductionBps: 1000,
    inputCostIncreaseBps: 1000,
    enabled: { harvestDelay: true, harvestIncomeReduction: true, inputCostIncrease: true },
  },
  SEVERE: {
    mode: "SEVERE",
    harvestDelayMonths: 2,
    harvestIncomeReductionBps: 3000,
    inputCostIncreaseBps: 2500,
    enabled: { harvestDelay: true, harvestIncomeReduction: true, inputCostIncrease: true },
  },
  CUSTOM: {
    mode: "CUSTOM",
    harvestDelayMonths: 1,
    harvestIncomeReductionBps: 2000,
    inputCostIncreaseBps: 1500,
    enabled: { harvestDelay: true, harvestIncomeReduction: true, inputCostIncrease: true },
  },
};

// ---------------------------------------------------------------------------
// Utility: date helpers (no runtime timezone conversion)
// ---------------------------------------------------------------------------

/** Parse "YYYY-MM-DD" into { year, month, day }. Throws on invalid format. */
function parseDate(dateStr: string): { year: number; month: number; day: number } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new EngineValidationError("INVALID_DATE_FORMAT", `Invalid date format: ${dateStr}`);
  }
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(5, 7), 10);
  const day = parseInt(dateStr.slice(8, 10), 10);

  if (month < 1 || month > 12) {
    throw new EngineValidationError("INVALID_DATE", `Invalid month in date: ${dateStr}`);
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    throw new EngineValidationError("INVALID_DATE", `Invalid day in date: ${dateStr}`);
  }
  return { year, month, day };
}

/** Return "YYYY-MM" from "YYYY-MM-DD". */
function toYearMonth(dateStr: string): string {
  parseDate(dateStr); // validate
  return dateStr.slice(0, 7);
}

/** Generate array of "YYYY-MM" strings from startDate to endDate (inclusive). */
function generateMonthRange(startDate: string, endDate: string): string[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const months: string[] = [];
  let y = start.year;
  let m = start.month;
  while (y < end.year || (y === end.year && m <= end.month)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

/** Count calendar months between two dates (exclusive of start, inclusive of end). */
function countCalendarMonths(startDate: string, endDate: string): number {
  const s = parseDate(startDate);
  const e = parseDate(endDate);
  return (e.year - s.year) * 12 + (e.month - s.month);
}

/** Add n calendar months to a date, clamping to last valid day. */
function addCalendarMonths(dateStr: string, months: number): string {
  const d = parseDate(dateStr);
  let y = d.year;
  let m = d.month + months;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(d.day, lastDay);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Utility: currency arithmetic
// ---------------------------------------------------------------------------

/** Alignment rounding for rupiah: Math.round only */
function roundRupiah(x: number): Rupiah {
  return Math.round(x);
}

/** Compute simple hash checksum for stable fingerprinting of input. */
function computeChecksum(input: CalculationInput): string {
  const str = JSON.stringify(input, Object.keys(input).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32-bit integer
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function assertNonNegativeSafeInteger(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new EngineValidationError("NON_INTEGER_CURRENCY", `Field ${field} must be an integer, got ${value}`);
  }
  if (value < 0) {
    throw new EngineValidationError("NEGATIVE_CURRENCY", `Field ${field} must be non-negative, got ${value}`);
  }
  if (value > Number.MAX_SAFE_INTEGER) {
    throw new EngineValidationError("CURRENCY_OUT_OF_RANGE", `Field ${field} exceeds MAX_SAFE_INTEGER: ${value}`);
  }
}

function validateInput(input: CalculationInput): void {
  // Dates
  const start = parseDate(input.planStartDate);
  const end = parseDate(input.planEndDate);
  if (end.year < start.year || (end.year === start.year && end.month < start.month)) {
    throw new EngineValidationError("END_BEFORE_START", "planEndDate must be after planStartDate");
  }

  // Currency fields
  assertNonNegativeSafeInteger(input.openingBalanceRupiah, "openingBalanceRupiah");
  assertNonNegativeSafeInteger(input.emergencyReserveRupiah, "emergencyReserveRupiah");
  assertNonNegativeSafeInteger(input.monthlyHouseholdExpenseRupiah, "monthlyHouseholdExpenseRupiah");

  // Cash flow items
  const planStartMonth = toYearMonth(input.planStartDate);
  const planEndMonth = toYearMonth(input.planEndDate);
  let hasHarvestIncome = false;

  for (const item of input.cashFlowItems) {
    assertNonNegativeSafeInteger(item.amountRupiah, `cashFlowItem[${item.id}].amountRupiah`);
    const itemMonth = toYearMonth(item.timingDate);
    if (itemMonth < planStartMonth || itemMonth > planEndMonth) {
      throw new EngineValidationError(
        "ITEM_OUTSIDE_HORIZON",
        `CashFlowItem [${item.id}] at ${item.timingDate} is outside the plan horizon`
      );
    }
    if (item.isHarvestIncome) hasHarvestIncome = true;
  }

  if (!hasHarvestIncome) {
    throw new EngineValidationError("MISSING_HARVEST_INCOME", "At least one cash flow item must be marked as harvest income");
  }

  // Financing validation
  const f = input.financingOption;
  assertNonNegativeSafeInteger(f.principalRupiah, "financing.principalRupiah");
  assertNonNegativeSafeInteger(f.administrationFeeRupiah, "financing.administrationFeeRupiah");
  assertNonNegativeSafeInteger(f.otherUpfrontFeesRupiah, "financing.otherUpfrontFeesRupiah");

  if (f.interestRateBps < 0) {
    throw new EngineValidationError("NEGATIVE_CURRENCY", "interestRateBps must be non-negative");
  }

  const finStart = parseDate(f.financingStartDate);
  const firstRepay = parseDate(f.firstRepaymentDate);
  if (
    firstRepay.year < finStart.year ||
    (firstRepay.year === finStart.year && firstRepay.month < finStart.month)
  ) {
    throw new EngineValidationError(
      "REPAYMENT_BEFORE_START",
      "firstRepaymentDate must not be before financingStartDate"
    );
  }

  if (f.repaymentStructure === "FLAT_MONTHLY" && f.repaymentFrequency === "ONCE") {
    throw new EngineValidationError("INCOMPATIBLE_STRUCTURE", "FLAT_MONTHLY is incompatible with ONCE frequency");
  }
  if (f.repaymentStructure === "BULLET" && f.numberOfInstallments > 1) {
    throw new EngineValidationError("INCOMPATIBLE_STRUCTURE", "BULLET must have exactly 1 installment");
  }
  if (f.repaymentStructure === "FLAT_MONTHLY" && f.numberOfInstallments < 1) {
    throw new EngineValidationError("ZERO_INSTALLMENTS", "numberOfInstallments must be >= 1 for FLAT_MONTHLY");
  }
  if (f.gracePeriodMonths !== 0) {
    throw new EngineValidationError("UNSUPPORTED_GRACE_PERIOD", "gracePeriodMonths must be 0 for MVP");
  }

  const supported = ["FLAT_MONTHLY", "BULLET"];
  if (!supported.includes(f.repaymentStructure)) {
    throw new EngineValidationError("UNSUPPORTED_REPAYMENT_STRUCTURE", `Unsupported repayment structure: ${f.repaymentStructure}`);
  }
}

// ---------------------------------------------------------------------------
// Financing schedule builder
// ---------------------------------------------------------------------------

function buildFlatMonthlySchedule(f: FinancingOptionInput): FinancingSchedule {
  const rateDecimal = f.interestRateBps / 10_000;
  const monthlyRate = f.interestPeriod === "MONTHLY" ? rateDecimal : rateDecimal / 12;

  const n = f.numberOfInstallments;
  const principal = f.principalRupiah;
  const totalInterest = roundRupiah(principal * monthlyRate * n);
  const totalRepayment = principal + totalInterest;
  const baseInstallment = Math.floor(totalRepayment / n);
  const remainder = totalRepayment % n;

  const payments: ScheduledPayment[] = [];
  let currentDate = f.firstRepaymentDate;

  for (let i = 1; i <= n; i++) {
    // First `remainder` installments get +Rp1
    const total = baseInstallment + (i <= remainder ? 1 : 0);
    const interestPortion = roundRupiah(totalInterest / n);
    payments.push({
      date: currentDate,
      principalRupiah: total - interestPortion,
      interestRupiah: interestPortion,
      totalRupiah: total,
    });
    if (i < n) {
      currentDate = addCalendarMonths(currentDate, 1);
    }
  }

  return {
    disbursementDate: f.financingStartDate,
    financingInflowRupiah: principal,
    financingFeeOutflowRupiah: f.administrationFeeRupiah + f.otherUpfrontFeesRupiah,
    payments,
    totalInterestRupiah: totalInterest,
    totalFeesRupiah: f.administrationFeeRupiah + f.otherUpfrontFeesRupiah,
    totalFinancingPaymentRupiah: totalRepayment,
  };
}

function buildBulletSchedule(f: FinancingOptionInput): FinancingSchedule {
  const rateDecimal = f.interestRateBps / 10_000;
  const monthsOutstanding = Math.max(1, countCalendarMonths(f.financingStartDate, f.firstRepaymentDate));

  const interestPeriods =
    f.interestPeriod === "MONTHLY" ? monthsOutstanding : monthsOutstanding / 12;

  const totalInterest = roundRupiah(f.principalRupiah * rateDecimal * interestPeriods);
  const bulletPayment = f.principalRupiah + totalInterest;

  return {
    disbursementDate: f.financingStartDate,
    financingInflowRupiah: f.principalRupiah,
    financingFeeOutflowRupiah: f.administrationFeeRupiah + f.otherUpfrontFeesRupiah,
    payments: [
      {
        date: f.firstRepaymentDate,
        principalRupiah: f.principalRupiah,
        interestRupiah: totalInterest,
        totalRupiah: bulletPayment,
      },
    ],
    totalInterestRupiah: totalInterest,
    totalFeesRupiah: f.administrationFeeRupiah + f.otherUpfrontFeesRupiah,
    totalFinancingPaymentRupiah: bulletPayment,
  };
}

function buildFinancingSchedule(f: FinancingOptionInput): FinancingSchedule {
  switch (f.repaymentStructure) {
    case "FLAT_MONTHLY":
      return buildFlatMonthlySchedule(f);
    case "BULLET":
      return buildBulletSchedule(f);
    default:
      throw new EngineValidationError(
        "UNSUPPORTED_REPAYMENT_STRUCTURE",
        `Repayment structure not implemented: ${f.repaymentStructure}`
      );
  }
}

// ---------------------------------------------------------------------------
// Monthly ledger
// ---------------------------------------------------------------------------

function buildMonthlyLedger(
  input: CalculationInput,
  schedule: FinancingSchedule,
  months: string[]
): MonthlyCashFlow[] {
  // Group cash flow items by YYYY-MM
  const incomeByMonth = new Map<string, { operating: Rupiah; harvest: Rupiah; nonFarm: Rupiah }>();
  const expenseByMonth = new Map<string, Rupiah>();

  for (const item of input.cashFlowItems) {
    const ym = toYearMonth(item.timingDate);
    if (item.type === "income") {
      const existing = incomeByMonth.get(ym) ?? { operating: 0, harvest: 0, nonFarm: 0 };
      if (item.isHarvestIncome) {
        existing.harvest += item.amountRupiah;
      } else if (item.category === "non_farm") {
        existing.nonFarm += item.amountRupiah;
      } else {
        existing.operating += item.amountRupiah;
      }
      incomeByMonth.set(ym, existing);
    } else {
      expenseByMonth.set(ym, (expenseByMonth.get(ym) ?? 0) + item.amountRupiah);
    }
  }

  // Group financing payments by YYYY-MM
  const paymentsByMonth = new Map<string, Rupiah>();
  for (const p of schedule.payments) {
    const ym = toYearMonth(p.date);
    paymentsByMonth.set(ym, (paymentsByMonth.get(ym) ?? 0) + p.totalRupiah);
  }

  // Fees and inflow are in disbursement month
  const disbursementMonth = toYearMonth(schedule.disbursementDate);

  let runningBalance = 0;
  const result: MonthlyCashFlow[] = [];

  for (let i = 0; i < months.length; i++) {
    const ym = months[i];
    const isFirst = i === 0;

    const incomeData = incomeByMonth.get(ym) ?? { operating: 0, harvest: 0, nonFarm: 0 };
    const operatingIncome = incomeData.operating + incomeData.harvest + incomeData.nonFarm;
    const productionExpense = expenseByMonth.get(ym) ?? 0;
    const householdExpense = input.monthlyHouseholdExpenseRupiah;
    const financingInflow = ym === disbursementMonth ? schedule.financingInflowRupiah : 0;
    const financingFee = ym === disbursementMonth ? schedule.financingFeeOutflowRupiah : 0;
    const financingPayment = paymentsByMonth.get(ym) ?? 0;

    // First month: add opening balance and emergency reserve
    const openingContribution = isFirst
      ? input.openingBalanceRupiah + input.emergencyReserveRupiah
      : 0;

    const netCashFlow =
      openingContribution +
      operatingIncome +
      financingInflow -
      productionExpense -
      householdExpense -
      financingFee -
      financingPayment;

    runningBalance += netCashFlow;

    result.push({
      month: ym,
      operatingIncomeRupiah: incomeData.operating + incomeData.harvest, // non-farm separate
      harvestIncomeRupiah: incomeData.harvest,
      nonFarmIncomeRupiah: incomeData.nonFarm,
      financingInflowRupiah: financingInflow,
      productionExpenseRupiah: productionExpense,
      householdExpenseRupiah: householdExpense,
      financingFeeRupiah: financingFee,
      financingPaymentRupiah: financingPayment,
      netCashFlowRupiah: netCashFlow,
      runningBalanceRupiah: runningBalance,
      isCashGap: runningBalance < 0,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Break-even harvest income
// ---------------------------------------------------------------------------

function computeBreakEven(
  input: CalculationInput,
  schedule: FinancingSchedule,
  months: string[]
): { breakEvenHarvestIncomeRupiah: Rupiah; preHarvestLiquidityRequiredRupiah: Rupiah } {
  // Build ledger with zero harvest income
  const zeroHarvestInput: CalculationInput = {
    ...input,
    cashFlowItems: input.cashFlowItems.map((item) =>
      item.isHarvestIncome ? { ...item, amountRupiah: 0 } : item
    ),
  };
  const zeroLedger = buildMonthlyLedger(zeroHarvestInput, schedule, months);
  const endingBalanceZero = zeroLedger[zeroLedger.length - 1].runningBalanceRupiah;
  const breakEvenHarvestIncomeRupiah = Math.max(0, -endingBalanceZero);

  // Pre-harvest liquidity required: worst running balance before first harvest month
  const firstHarvestItem = input.cashFlowItems.find((item) => item.isHarvestIncome);
  let preHarvestLiquidityRequiredRupiah = 0;
  if (firstHarvestItem) {
    const firstHarvestMonth = toYearMonth(firstHarvestItem.timingDate);
    const preHarvestMonths = zeroLedger.filter((m) => m.month < firstHarvestMonth);
    if (preHarvestMonths.length > 0) {
      const minPre = Math.min(...preHarvestMonths.map((m) => m.runningBalanceRupiah));
      preHarvestLiquidityRequiredRupiah = Math.max(0, -minPre);
    }
  }

  return { breakEvenHarvestIncomeRupiah, preHarvestLiquidityRequiredRupiah };
}

// ---------------------------------------------------------------------------
// Risk Assessment (prototype-1 deduction rules)
// ---------------------------------------------------------------------------

export function assessRisk(
  expectedResult: CashFlowResult,
  stressResult: CashFlowResult | null,
  input: CalculationInput
): RiskAssessment {
  let score = 100;
  const factors: RiskFactor[] = [];

  const cfg = RISK_CONFIG;

  // 1. Expected scenario maximum cash gap > 0 → -35
  if (expectedResult.maximumCashGapRupiah > 0) {
    const deduction = cfg.deductions.expectedMaxCashGap;
    score -= deduction;
    factors.push({
      code: "EXPECTED_CASH_GAP",
      deduction,
      actualValue: expectedResult.maximumCashGapRupiah,
      threshold: 0,
      explanationKey: "risk.expectedCashGap",
    });
  }

  // 2. Stress creates/increases gap → -20
  if (stressResult && stressResult.maximumCashGapRupiah > expectedResult.maximumCashGapRupiah) {
    const deduction = cfg.deductions.anyStressCashGap;
    score -= deduction;
    factors.push({
      code: "STRESS_INCREASES_GAP",
      deduction,
      actualValue: stressResult.maximumCashGapRupiah,
      threshold: expectedResult.maximumCashGapRupiah,
      explanationKey: "risk.stressGap",
    });
  }

  // 3. Repayment-to-income ratio tiers (exclusive)
  const rtiTier = cfg.tiers.repaymentToIncome.find(
    (t) =>
      expectedResult.repaymentToIncomeRatioBps >= t.minBps &&
      expectedResult.repaymentToIncomeRatioBps <= t.maxBps
  );
  if (rtiTier) {
    score -= rtiTier.deduction;
    factors.push({
      code: "REPAYMENT_TO_INCOME_RATIO",
      deduction: rtiTier.deduction,
      actualValue: expectedResult.repaymentToIncomeRatioBps,
      threshold: `${rtiTier.minBps}-${rtiTier.maxBps} bps`,
      explanationKey: "risk.repaymentToIncome",
    });
  }

  // 4. Opening + reserve coverage (exclusive tiers)
  const totalBuffer = input.openingBalanceRupiah + input.emergencyReserveRupiah;
  const householdMonthly = input.monthlyHouseholdExpenseRupiah;
  const coverageMonths = householdMonthly > 0 ? totalBuffer / householdMonthly : Infinity;
  const reserveTier = cfg.tiers.reserveCoverage.find(
    (t) => coverageMonths >= t.minMonths && coverageMonths < t.maxMonths + 0.001
  );
  if (reserveTier) {
    score -= reserveTier.deduction;
    factors.push({
      code: "RESERVE_COVERAGE",
      deduction: reserveTier.deduction,
      actualValue: Math.round(coverageMonths * 100) / 100,
      threshold: `${reserveTier.minMonths}-${reserveTier.maxMonths} months`,
      explanationKey: "risk.reserveCoverage",
    });
  }

  // 5. Expected ending balance tiers (exclusive)
  const endingBalance = expectedResult.endingBalanceRupiah;
  const endingMonths = householdMonthly > 0 ? endingBalance / householdMonthly : Infinity;
  const endingTier = cfg.tiers.endingBalanceCoverage.find(
    (t) => endingMonths >= t.minMonths && endingMonths < t.maxMonths + 0.001
  );
  if (endingTier) {
    score -= endingTier.deduction;
    factors.push({
      code: "ENDING_BALANCE",
      deduction: endingTier.deduction,
      actualValue: endingBalance,
      threshold: `${endingTier.minMonths}-${endingTier.maxMonths} household months`,
      explanationKey: "risk.endingBalance",
    });
  }

  // 6. Financing cost > 30% principal → -5
  const financingCostRatio =
    input.financingOption.principalRupiah > 0
      ? expectedResult.totalFinancingCostRupiah / input.financingOption.principalRupiah
      : 0;
  if (financingCostRatio > 0.3) {
    const deduction = cfg.deductions.financingCostRatio;
    score -= deduction;
    factors.push({
      code: "HIGH_FINANCING_COST",
      deduction,
      actualValue: Math.round(financingCostRatio * 10000),
      threshold: 3000,
      explanationKey: "risk.highFinancingCost",
    });
  }

  // 7. Sensitivity gaps: each major stress scenario that creates new gap → -5, capped at -10
  // (Handled in stress result comparison above; additional sensitivity deduction skipped for MVP)

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  let category: RiskAssessment["category"];
  if (score >= cfg.thresholds.resilientMin) {
    category = "RELATIVELY_RESILIENT";
  } else if (score >= cfg.thresholds.needsAdjustmentMin) {
    category = "NEEDS_ADJUSTMENT";
  } else {
    category = "HIGH_CASH_FLOW_RISK";
  }

  return {
    score,
    category,
    configVersion: cfg.version,
    factors,
    disclaimerRequired: true,
  };
}

// ---------------------------------------------------------------------------
// Scenario transform
// ---------------------------------------------------------------------------

function applyScenario(input: CalculationInput, scenario: ScenarioConfig): CalculationInput {
  // Deep clone – no mutation of base input
  const cloned: CalculationInput = JSON.parse(JSON.stringify(input));

  // Ordered transforms: INPUT_COST_INCREASE → HARVEST_INCOME_REDUCTION → HARVEST_DELAY
  const items = cloned.cashFlowItems.map((item: CashFlowItem) => {
    let result = { ...item };

    // 1. INPUT_COST_INCREASE
    if (scenario.enabled.inputCostIncrease && item.type === "production_expense") {
      result = {
        ...result,
        amountRupiah: roundRupiah(item.amountRupiah * (1 + scenario.inputCostIncreaseBps / 10_000)),
      };
    }

    // 2. HARVEST_INCOME_REDUCTION
    if (scenario.enabled.harvestIncomeReduction && item.isHarvestIncome) {
      result = {
        ...result,
        amountRupiah: roundRupiah(result.amountRupiah * (1 - scenario.harvestIncomeReductionBps / 10_000)),
      };
    }

    // 3. HARVEST_DELAY
    if (scenario.enabled.harvestDelay && item.isHarvestIncome) {
      result = {
        ...result,
        timingDate: addCalendarMonths(result.timingDate, scenario.harvestDelayMonths),
      };
    }

    return result;
  });

  return { ...cloned, cashFlowItems: items };
}

// ---------------------------------------------------------------------------
// Main calculation function
// ---------------------------------------------------------------------------

export function calculatePlan(
  input: CalculationInput,
  scenario: ScenarioConfig = SCENARIO_DEFAULTS.EXPECTED
): CashFlowResult {
  // Validate base input
  validateInput(input);

  // Apply scenario transforms (does not mutate input)
  const effectiveInput = applyScenario(input, scenario);

  // Validate scenario horizon: shifted harvest items must be within plan end
  const planEndMonth = toYearMonth(effectiveInput.planEndDate);
  for (const item of effectiveInput.cashFlowItems) {
    if (item.isHarvestIncome) {
      const itemMonth = toYearMonth(item.timingDate);
      if (itemMonth > planEndMonth) {
        throw new EngineValidationError(
          "SCENARIO_OUTSIDE_HORIZON",
          `Shifted harvest date ${item.timingDate} is outside the plan horizon (end: ${effectiveInput.planEndDate})`
        );
      }
    }
  }

  const schedule = buildFinancingSchedule(effectiveInput.financingOption);
  const months = generateMonthRange(effectiveInput.planStartDate, effectiveInput.planEndDate);
  const monthly = buildMonthlyLedger(effectiveInput, schedule, months);

  // Aggregate metrics
  const runningBalances = monthly.map((m) => m.runningBalanceRupiah);
  const minimumBalanceRupiah = Math.min(...runningBalances);
  const maximumCashGapRupiah = Math.max(0, -minimumBalanceRupiah);
  const firstCashGapMonth = monthly.find((m) => m.isCashGap)?.month ?? null;
  const negativeCashFlowMonths = monthly.filter((m) => m.netCashFlowRupiah < 0).length;
  const endingBalanceRupiah = runningBalances[runningBalances.length - 1];

  const totalOperatingIncome = monthly.reduce(
    (sum, m) => sum + m.operatingIncomeRupiah + m.nonFarmIncomeRupiah,
    0
  );

  const warnings: string[] = [];
  const repaymentToIncomeRatioBps =
    totalOperatingIncome > 0
      ? Math.round((schedule.totalFinancingPaymentRupiah / totalOperatingIncome) * 10_000)
      : (warnings.push("NO_OPERATING_INCOME_FOR_RATIO"), 0);

  const { breakEvenHarvestIncomeRupiah, preHarvestLiquidityRequiredRupiah } = computeBreakEven(
    effectiveInput,
    schedule,
    months
  );

  const assumptions: string[] = [
    "FLAT_RATE_NO_COMPOUNDING",
    "ANNUAL_RATE_PRORATED_MONTHLY",
    "UPFRONT_FEES_NOT_NETTED",
    "HOUSEHOLD_EXPENSE_EVERY_MONTH",
  ];

  return {
    engineVersion: ENGINE_VERSION,
    inputChecksum: computeChecksum(input),
    monthly,
    minimumBalanceRupiah,
    maximumCashGapRupiah,
    firstCashGapMonth,
    totalFinancingPaymentRupiah: schedule.totalFinancingPaymentRupiah,
    totalInterestRupiah: schedule.totalInterestRupiah,
    totalFeesRupiah: schedule.totalFeesRupiah,
    totalFinancingCostRupiah: schedule.totalInterestRupiah + schedule.totalFeesRupiah,
    breakEvenHarvestIncomeRupiah,
    preHarvestLiquidityRequiredRupiah,
    repaymentToIncomeRatioBps,
    negativeCashFlowMonths,
    endingBalanceRupiah,
    assumptions,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

export interface ComparisonResult {
  optionA: CashFlowResult;
  optionB: CashFlowResult;
  scenarioResults: {
    scenario: ScenarioConfig;
    resultA: CashFlowResult;
    resultB: CashFlowResult;
  }[];
  resilienceDelta: number; // optionA.endingBalance - optionB.endingBalance in expected scenario
  advantage: "A" | "B" | "NO_CLEAR_ADVANTAGE";
  advantageReasonKey: string;
}

export function comparePlans(
  baseInput: CalculationInput,
  optionA: FinancingOptionInput,
  optionB: FinancingOptionInput,
  scenarios: ScenarioConfig[] = [SCENARIO_DEFAULTS.EXPECTED, SCENARIO_DEFAULTS.SEVERE]
): ComparisonResult {
  const inputA: CalculationInput = { ...baseInput, financingOption: optionA };
  const inputB: CalculationInput = { ...baseInput, financingOption: optionB };

  const expectedA = calculatePlan(inputA, SCENARIO_DEFAULTS.EXPECTED);
  const expectedB = calculatePlan(inputB, SCENARIO_DEFAULTS.EXPECTED);

  const scenarioResults = scenarios.map((s) => ({
    scenario: s,
    resultA: calculatePlan(inputA, s),
    resultB: calculatePlan(inputB, s),
  }));

  const resilienceDelta = expectedA.endingBalanceRupiah - expectedB.endingBalanceRupiah;

  // Tie-breaking rules (ordered)
  let advantage: "A" | "B" | "NO_CLEAR_ADVANTAGE" = "NO_CLEAR_ADVANTAGE";
  let advantageReasonKey = "comparison.noClearAdvantage";

  const gapsA = expectedA.maximumCashGapRupiah;
  const gapsB = expectedB.maximumCashGapRupiah;

  // 1. Fewer expected-scenario cash gaps
  if (gapsA === 0 && gapsB > 0) {
    advantage = "A"; advantageReasonKey = "comparison.fewerCashGaps";
  } else if (gapsB === 0 && gapsA > 0) {
    advantage = "B"; advantageReasonKey = "comparison.fewerCashGaps";
  } else {
    // 2. Lower worst-scenario maximum cash gap
    const worstGapA = Math.max(...scenarioResults.map((r) => r.resultA.maximumCashGapRupiah));
    const worstGapB = Math.max(...scenarioResults.map((r) => r.resultB.maximumCashGapRupiah));
    if (worstGapA < worstGapB) {
      advantage = "A"; advantageReasonKey = "comparison.lowerWorstGap";
    } else if (worstGapB < worstGapA) {
      advantage = "B"; advantageReasonKey = "comparison.lowerWorstGap";
    } else {
      // 3. Later first gap month
      const fgA = expectedA.firstCashGapMonth ?? "9999-99";
      const fgB = expectedB.firstCashGapMonth ?? "9999-99";
      if (fgA > fgB) {
        advantage = "A"; advantageReasonKey = "comparison.laterFirstGap";
      } else if (fgB > fgA) {
        advantage = "B"; advantageReasonKey = "comparison.laterFirstGap";
      } else {
        // 4. Higher worst-scenario ending balance
        const worstEndA = Math.min(...scenarioResults.map((r) => r.resultA.endingBalanceRupiah));
        const worstEndB = Math.min(...scenarioResults.map((r) => r.resultB.endingBalanceRupiah));
        if (worstEndA > worstEndB) {
          advantage = "A"; advantageReasonKey = "comparison.higherWorstEndingBalance";
        } else if (worstEndB > worstEndA) {
          advantage = "B"; advantageReasonKey = "comparison.higherWorstEndingBalance";
        } else {
          // 5. Lower total financing cost
          if (expectedA.totalFinancingCostRupiah < expectedB.totalFinancingCostRupiah) {
            advantage = "A"; advantageReasonKey = "comparison.lowerFinancingCost";
          } else if (expectedB.totalFinancingCostRupiah < expectedA.totalFinancingCostRupiah) {
            advantage = "B"; advantageReasonKey = "comparison.lowerFinancingCost";
          }
        }
      }
    }
  }

  return {
    optionA: expectedA,
    optionB: expectedB,
    scenarioResults,
    resilienceDelta,
    advantage,
    advantageReasonKey,
  };
}

export function transformScenario(input: CalculationInput, config: ScenarioConfig): CalculationInput {
  return applyScenario(input, config);
}

export function calculateResilienceScore(
  baseInput: CalculationInput,
  expectedResult: CashFlowResult,
  mildResult: CashFlowResult,
  severeResult: CashFlowResult,
  customResult: CashFlowResult | null
): RiskAssessment {
  let score = 100;
  const factors: RiskFactor[] = [];

  // Factor 1: Expected scenario maximum cash gap > 0 (Defisit Kas terjadi di kondisi normal)
  if (expectedResult.maximumCashGapRupiah > 0) {
    score -= 35;
    factors.push({
      code: "EXPECTED_CASH_GAP",
      deduction: 35,
      actualValue: expectedResult.maximumCashGapRupiah,
      threshold: 0,
      explanationKey: "Defisit kas terdeteksi pada skenario normal.",
    });
  }

  // Factor 2: Any enabled stress creates/increases cash gap
  const maxStressGap = Math.max(
    mildResult.maximumCashGapRupiah,
    severeResult.maximumCashGapRupiah,
    customResult ? customResult.maximumCashGapRupiah : 0
  );
  if (maxStressGap > expectedResult.maximumCashGapRupiah) {
    score -= 20;
    factors.push({
      code: "STRESS_INCREASES_GAP",
      deduction: 20,
      actualValue: maxStressGap,
      threshold: expectedResult.maximumCashGapRupiah,
      explanationKey: "Uji stres memperparah defisit kas.",
    });
  }

  // Factor 3: Repayment-to-income
  const ratio = expectedResult.repaymentToIncomeRatioBps;
  if (ratio > 5000) {
    score -= 15;
    factors.push({
      code: "REPAYMENT_TO_INCOME_CRITICAL",
      deduction: 15,
      actualValue: `${(ratio / 100).toFixed(1)}%`,
      threshold: "50.0%",
      explanationKey: "Rasio cicilan terhadap pendapatan melebihi batas kritis 50%.",
    });
  } else if (ratio > 3500) {
    score -= 10;
    factors.push({
      code: "REPAYMENT_TO_INCOME_SEVERE",
      deduction: 10,
      actualValue: `${(ratio / 100).toFixed(1)}%`,
      threshold: "35.0%",
      explanationKey: "Rasio cicilan terhadap pendapatan melebihi batas aman 35%.",
    });
  } else if (ratio > 2000) {
    score -= 5;
    factors.push({
      code: "REPAYMENT_TO_INCOME_MILD",
      deduction: 5,
      actualValue: `${(ratio / 100).toFixed(1)}%`,
      threshold: "20.0%",
      explanationKey: "Rasio cicilan terhadap pendapatan di atas 20%.",
    });
  }

  // Factor 4: Opening + reserve covers household months
  const totalReserves = baseInput.openingBalanceRupiah + baseInput.emergencyReserveRupiah;
  const householdExpense = baseInput.monthlyHouseholdExpenseRupiah;
  if (householdExpense > 0) {
    const coverageMonths = totalReserves / householdExpense;
    if (coverageMonths < 1) {
      score -= 10;
      factors.push({
        code: "RESERVE_COVERAGE_CRITICAL",
        deduction: 10,
        actualValue: `${coverageMonths.toFixed(2)} bulan`,
        threshold: "1.00 bulan",
        explanationKey: "Dana cadangan awal tidak cukup menutupi pengeluaran keluarga 1 bulan.",
      });
    } else if (coverageMonths < 2) {
      score -= 5;
      factors.push({
        code: "RESERVE_COVERAGE_MILD",
        deduction: 5,
        actualValue: `${coverageMonths.toFixed(2)} bulan`,
        threshold: "2.00 bulan",
        explanationKey: "Dana cadangan awal kurang dari 2 bulan kebutuhan keluarga.",
      });
    }
  }

  // Factor 5: Expected ending balance
  const endingBalance = expectedResult.endingBalanceRupiah;
  if (endingBalance <= 0) {
    score -= 10;
    factors.push({
      code: "ENDING_BALANCE_NEGATIVE",
      deduction: 10,
      actualValue: endingBalance,
      threshold: 0,
      explanationKey: "Proyeksi saldo kas akhir bernilai negatif atau nol.",
    });
  } else if (householdExpense > 0 && endingBalance < householdExpense) {
    score -= 5;
    factors.push({
      code: "ENDING_BALANCE_LOW",
      deduction: 5,
      actualValue: endingBalance,
      threshold: householdExpense,
      explanationKey: "Saldo kas akhir kurang dari biaya 1 bulan rumah tangga.",
    });
  }

  // Factor 6: Financing cost > 30% of principal
  if (baseInput.financingOption) {
    const principal = baseInput.financingOption.principalRupiah;
    if (principal > 0) {
      const financingCost = expectedResult.totalInterestRupiah + expectedResult.totalFeesRupiah;
      if (financingCost / principal > 0.3) {
        score -= 5;
        factors.push({
          code: "HIGH_FINANCING_COST",
          deduction: 5,
          actualValue: `${((financingCost / principal) * 100).toFixed(1)}%`,
          threshold: "30.0%",
          explanationKey: "Total biaya pinjaman (bunga + biaya) melebihi 30% dari pokok pinjaman.",
        });
      }
    }
  }

  // Factor 7: Gaps in sensitivity testing
  // Delay only
  const delayOnlyConfig: ScenarioConfig = {
    mode: "CUSTOM",
    harvestDelayMonths: 1,
    harvestIncomeReductionBps: 0,
    inputCostIncreaseBps: 0,
    enabled: { harvestDelay: true, harvestIncomeReduction: false, inputCostIncrease: false },
  };
  const delayResult = calculatePlan(transformScenario(baseInput, delayOnlyConfig));
  
  // Reduction only
  const reductionOnlyConfig: ScenarioConfig = {
    mode: "CUSTOM",
    harvestDelayMonths: 0,
    harvestIncomeReductionBps: 1000, // 10%
    inputCostIncreaseBps: 0,
    enabled: { harvestDelay: false, harvestIncomeReduction: true, inputCostIncrease: false },
  };
  const reductionResult = calculatePlan(transformScenario(baseInput, reductionOnlyConfig));

  // Cost increase only
  const costOnlyConfig: ScenarioConfig = {
    mode: "CUSTOM",
    harvestDelayMonths: 0,
    harvestIncomeReductionBps: 0,
    inputCostIncreaseBps: 1000, // 10%
    enabled: { harvestDelay: false, harvestIncomeReduction: false, inputCostIncrease: true },
  };
  const costResult = calculatePlan(transformScenario(baseInput, costOnlyConfig));

  let sensitivityGapCount = 0;
  if (delayResult.maximumCashGapRupiah > expectedResult.maximumCashGapRupiah) sensitivityGapCount++;
  if (reductionResult.maximumCashGapRupiah > expectedResult.maximumCashGapRupiah) sensitivityGapCount++;
  if (costResult.maximumCashGapRupiah > expectedResult.maximumCashGapRupiah) sensitivityGapCount++;

  if (sensitivityGapCount > 0) {
    const deduction = Math.min(10, sensitivityGapCount * 5);
    score -= deduction;
    factors.push({
      code: "SENSITIVITY_GAPS",
      deduction,
      actualValue: sensitivityGapCount,
      threshold: 0,
      explanationKey: `Pemberian stressor mandiri menimbulkan cash gap baru (${sensitivityGapCount} sensitivitas).`,
    });
  }

  score = Math.max(0, Math.min(100, score));

  let category: RiskAssessment["category"] = "RELATIVELY_RESILIENT";
  if (score < 50) {
    category = "HIGH_CASH_FLOW_RISK";
  } else if (score < 75) {
    category = "NEEDS_ADJUSTMENT";
  }

  return {
    score,
    category,
    configVersion: "prototype-1",
    factors,
    disclaimerRequired: true,
  };
}

// Re-export types for consumers
export type { CalculationInput, CashFlowResult, MonthlyCashFlow, RiskAssessment, RiskFactor, ScenarioConfig };
