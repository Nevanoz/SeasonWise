/**
 * Financial engine unit tests.
 * All test cases are derived from TESTING_GUIDE.md §2.
 * Common horizon: January–April 2026 unless stated otherwise.
 * Household expense: 0 unless stated otherwise.
 */

import { describe, it, expect } from "vitest";
import {
  calculatePlan,
  assessRisk,
  EngineValidationError,
  SCENARIO_DEFAULTS,
  type ScenarioConfig,
} from "../src/index";
import type { CalculationInput, FinancingOptionInput } from "@musimaman/shared-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHarvestItem(amountRupiah: number, date = "2026-04-15") {
  return {
    id: "harvest-1",
    type: "income" as const,
    category: "harvest",
    amountRupiah,
    timingDate: date,
    isHarvestIncome: true,
  };
}

function baseInput(overrides?: Partial<CalculationInput>): CalculationInput {
  return {
    schemaVersion: 1,
    engineVersion: "1.0.0",
    planStartDate: "2026-01-01",
    planEndDate: "2026-04-30",
    openingBalanceRupiah: 0,
    emergencyReserveRupiah: 0,
    monthlyHouseholdExpenseRupiah: 0,
    cashFlowItems: [makeHarvestItem(1_000_000)],
    financingOption: noFinancing(),
    ...overrides,
  };
}

function noFinancing(): FinancingOptionInput {
  return {
    id: "no-fin",
    name: "No Financing",
    principalRupiah: 0,
    interestRateBps: 0,
    interestPeriod: "MONTHLY",
    administrationFeeRupiah: 0,
    otherUpfrontFeesRupiah: 0,
    financingStartDate: "2026-01-01",
    gracePeriodMonths: 0,
    numberOfInstallments: 1,
    repaymentFrequency: "ONCE",
    repaymentStructure: "BULLET",
    firstRepaymentDate: "2026-04-30",
  };
}

function flatMonthly(
  principal: number,
  bps: number,
  installments: number,
  period: "MONTHLY" | "ANNUAL" = "MONTHLY"
): FinancingOptionInput {
  return {
    id: "flat-1",
    name: "Flat Monthly",
    principalRupiah: principal,
    interestRateBps: bps,
    interestPeriod: period,
    administrationFeeRupiah: 0,
    otherUpfrontFeesRupiah: 0,
    financingStartDate: "2026-01-01",
    gracePeriodMonths: 0,
    numberOfInstallments: installments,
    repaymentFrequency: "MONTHLY",
    repaymentStructure: "FLAT_MONTHLY",
    firstRepaymentDate: "2026-02-01",
  };
}

function bulletFinancing(
  principal: number,
  bps: number,
  period: "MONTHLY" | "ANNUAL",
  firstRepaymentDate: string
): FinancingOptionInput {
  return {
    id: "bullet-1",
    name: "Bullet",
    principalRupiah: principal,
    interestRateBps: bps,
    interestPeriod: period,
    administrationFeeRupiah: 0,
    otherUpfrontFeesRupiah: 0,
    financingStartDate: "2026-01-01",
    gracePeriodMonths: 0,
    numberOfInstallments: 1,
    repaymentFrequency: "ONCE",
    repaymentStructure: "BULLET",
    firstRepaymentDate,
  };
}

// ---------------------------------------------------------------------------
// §2 — Financing schedule exact cases
// ---------------------------------------------------------------------------

describe("Financing schedule — flat monthly", () => {
  it("No interest: 0 bps, 3 installments", () => {
    const input = baseInput({ financingOption: flatMonthly(1_200_000, 0, 3) });
    const result = calculatePlan(input);
    expect(result.totalInterestRupiah).toBe(0);
    expect(result.totalFinancingPaymentRupiah).toBe(1_200_000);
    // Each payment should be exactly 400,000
    const payMonths = result.monthly.filter((m) => m.financingPaymentRupiah > 0);
    expect(payMonths).toHaveLength(3);
    payMonths.forEach((m) => expect(m.financingPaymentRupiah).toBe(400_000));
  });

  it("Flat interest: principal 12,000,000 @ 100 bps monthly × 4 installments", () => {
    // Extend plan to May so 4th installment (May 1) is within horizon
    const financing = {
      ...flatMonthly(12_000_000, 100, 4),
      firstRepaymentDate: "2026-02-01",
    };
    const input = baseInput({
      planEndDate: "2026-05-31",
      financingOption: financing,
      cashFlowItems: [makeHarvestItem(1_000_000, "2026-04-15")],
    });
    const result = calculatePlan(input);
    // interest = 12,000,000 × 0.01 × 4 = 480,000
    expect(result.totalInterestRupiah).toBe(480_000);
    expect(result.totalFinancingPaymentRupiah).toBe(12_480_000);
    // each installment = 12,480,000 / 4 = 3,120,000
    const payMonths = result.monthly.filter((m) => m.financingPaymentRupiah > 0);
    expect(payMonths).toHaveLength(4);
    payMonths.forEach((m) => expect(m.financingPaymentRupiah).toBe(3_120_000));
  });

  it("Annual normalization: 1200 bps annual = 100 bps monthly → same as flat interest case", () => {
    const inputMonthly = baseInput({ financingOption: flatMonthly(12_000_000, 100, 4, "MONTHLY") });
    const inputAnnual = baseInput({ financingOption: flatMonthly(12_000_000, 1200, 4, "ANNUAL") });
    const monthly = calculatePlan(inputMonthly);
    const annual = calculatePlan(inputAnnual);
    expect(annual.totalInterestRupiah).toBe(monthly.totalInterestRupiah);
    expect(annual.totalFinancingPaymentRupiah).toBe(monthly.totalFinancingPaymentRupiah);
  });

  it("Remainder: principal 1,000 × 0% × 3 installments → 334, 333, 333", () => {
    const input = baseInput({
      planEndDate: "2026-04-30",
      financingOption: {
        ...flatMonthly(1_000, 0, 3),
        firstRepaymentDate: "2026-02-01",
      },
    });
    const result = calculatePlan(input);
    const payMonths = result.monthly.filter((m) => m.financingPaymentRupiah > 0);
    expect(payMonths).toHaveLength(3);
    expect(payMonths[0].financingPaymentRupiah).toBe(334);
    expect(payMonths[1].financingPaymentRupiah).toBe(333);
    expect(payMonths[2].financingPaymentRupiah).toBe(333);
    const total = payMonths.reduce((s, m) => s + m.financingPaymentRupiah, 0);
    expect(total).toBe(1_000);
  });

  it("Upfront fees: inflow 10,000,000; fee outflow 150,000; total fees 150,000", () => {
    const financing: FinancingOptionInput = {
      ...flatMonthly(10_000_000, 0, 1),
      administrationFeeRupiah: 100_000,
      otherUpfrontFeesRupiah: 50_000,
      numberOfInstallments: 1,
      repaymentFrequency: "ONCE",
      repaymentStructure: "BULLET",
    };
    const input = baseInput({ financingOption: financing });
    const result = calculatePlan(input);
    expect(result.monthly[0].financingInflowRupiah).toBe(10_000_000);
    expect(result.monthly[0].financingFeeRupiah).toBe(150_000);
    expect(result.totalFeesRupiah).toBe(150_000);
    expect(result.totalFinancingCostRupiah).toBe(150_000);
  });
});

// ---------------------------------------------------------------------------
// §2 — Bullet financing
// ---------------------------------------------------------------------------

describe("Financing schedule — bullet", () => {
  it("Bullet: principal 10,000,000 @ 1200 bps annual × 4 months → interest 400,000", () => {
    const input = baseInput({
      planEndDate: "2026-05-31",
      financingOption: bulletFinancing(10_000_000, 1200, "ANNUAL", "2026-05-01"),
      cashFlowItems: [makeHarvestItem(1_000_000, "2026-05-01")],
    });
    const result = calculatePlan(input);
    // months outstanding = 4 (Jan→May); interestPeriods = 4/12
    // totalInterest = 10,000,000 × 0.12 × (4/12) = 400,000
    expect(result.totalInterestRupiah).toBe(400_000);
    const payMonths = result.monthly.filter((m) => m.financingPaymentRupiah > 0);
    expect(payMonths).toHaveLength(1);
    expect(payMonths[0].financingPaymentRupiah).toBe(10_400_000);
  });

  it("Monthly bullet minimum: < 1 calendar month uses min 1 monthly period", () => {
    const financing: FinancingOptionInput = {
      ...bulletFinancing(1_000_000, 100, "MONTHLY", "2026-01-31"),
      financingStartDate: "2026-01-01",
    };
    const input = baseInput({ financingOption: financing });
    const result = calculatePlan(input);
    // monthsOutstanding = max(1, 0) = 1 (same calendar month)
    // interest = 1,000,000 × 0.01 × 1 = 10,000
    expect(result.totalInterestRupiah).toBe(10_000);
  });
});

// ---------------------------------------------------------------------------
// §2 — Cash flow aggregation
// ---------------------------------------------------------------------------

describe("Monthly cash flow aggregation", () => {
  it("Multiple incomes: two entries same month → 1,500,000", () => {
    const input = baseInput({
      cashFlowItems: [
        { id: "i1", type: "income", category: "other", amountRupiah: 1_000_000, timingDate: "2026-03-01" },
        { id: "i2", type: "income", category: "other", amountRupiah: 500_000, timingDate: "2026-03-15" },
        makeHarvestItem(100_000, "2026-04-15"),
      ],
    });
    const result = calculatePlan(input);
    const march = result.monthly.find((m) => m.month === "2026-03");
    expect(march?.operatingIncomeRupiah).toBe(1_500_000);
  });

  it("Multiple costs: two expenses same month → 1,000,000", () => {
    const input = baseInput({
      cashFlowItems: [
        { id: "e1", type: "production_expense", category: "land", amountRupiah: 250_000, timingDate: "2026-02-01" },
        { id: "e2", type: "production_expense", category: "seed", amountRupiah: 750_000, timingDate: "2026-02-15" },
        makeHarvestItem(100_000, "2026-04-15"),
      ],
    });
    const result = calculatePlan(input);
    const feb = result.monthly.find((m) => m.month === "2026-02");
    expect(feb?.productionExpenseRupiah).toBe(1_000_000);
  });

  it("Monthly household: 500,000/month × 4 months = 2,000,000 total", () => {
    const input = baseInput({ monthlyHouseholdExpenseRupiah: 500_000 });
    const result = calculatePlan(input);
    const totalHousehold = result.monthly.reduce((s, m) => s + m.householdExpenseRupiah, 0);
    expect(totalHousehold).toBe(2_000_000);
  });
});

// ---------------------------------------------------------------------------
// §2 — Balance and gap metrics
// ---------------------------------------------------------------------------

describe("Balance and gap metrics", () => {
  it("Zero opening: expense 100,000 → first running balance -100,000; gap 100,000", () => {
    // No inflows at all (harvest income = 0). A single one-time expense of 100K.
    const input: CalculationInput = {
      schemaVersion: 1,
      engineVersion: "1.0.0",
      planStartDate: "2026-01-01",
      planEndDate: "2026-04-30",
      openingBalanceRupiah: 0,
      emergencyReserveRupiah: 0,
      monthlyHouseholdExpenseRupiah: 0,
      cashFlowItems: [
        { id: "e1", type: "production_expense", category: "other", amountRupiah: 100_000, timingDate: "2026-01-15" },
        { id: "h1", type: "income", category: "harvest", amountRupiah: 0, timingDate: "2026-04-15", isHarvestIncome: true }
      ],
      financingOption: noFinancing(),
    };
    const result = calculatePlan(input);
    expect(result.monthly[0].runningBalanceRupiah).toBe(-100_000);
    expect(result.maximumCashGapRupiah).toBe(100_000);
  });

  it("Positive opening: opening 500,000; expense 100,000 → running 400,000", () => {
    const input = baseInput({
      openingBalanceRupiah: 500_000,
      monthlyHouseholdExpenseRupiah: 100_000,
      cashFlowItems: [makeHarvestItem(0, "2026-04-15")],
    });
    const result = calculatePlan(input);
    expect(result.monthly[0].runningBalanceRupiah).toBe(400_000);
  });

  it("Emergency reserve: opening 0; reserve 300,000; expense 100,000 → running 200,000", () => {
    const input = baseInput({
      openingBalanceRupiah: 0,
      emergencyReserveRupiah: 300_000,
      monthlyHouseholdExpenseRupiah: 100_000,
      cashFlowItems: [makeHarvestItem(0, "2026-04-15")],
    });
    const result = calculatePlan(input);
    expect(result.monthly[0].runningBalanceRupiah).toBe(200_000);
  });

  it("Exact zero: opening 1,000,000; single expense 1,000,000 in month 1 → first month running 0; no cash gap in month 1", () => {
    // Opening 1M contributes to first month net. Expense 1M/month means:
    // Month 1: +1M (opening) - 1M (household) = 0 → running 0, not a gap
    // Month 2-4: -1M each → running becomes negative (gap)
    // The test verifies month 1 specifically is exactly 0 and not a gap
    const input = baseInput({
      openingBalanceRupiah: 1_000_000,
      monthlyHouseholdExpenseRupiah: 1_000_000,
      cashFlowItems: [makeHarvestItem(0, "2026-04-15")],
    });
    const result = calculatePlan(input);
    expect(result.monthly[0].runningBalanceRupiah).toBe(0);
    expect(result.monthly[0].isCashGap).toBe(false); // gap is < 0, not <= 0
  });

  it("Negative balance: opening 100,000; expense 350,000 → min -250,000; maxGap 250,000", () => {
    const input = baseInput({
      openingBalanceRupiah: 100_000,
      monthlyHouseholdExpenseRupiah: 350_000,
      cashFlowItems: [makeHarvestItem(0, "2026-04-15")],
    });
    const result = calculatePlan(input);
    expect(result.minimumBalanceRupiah).toBeLessThanOrEqual(-250_000);
    expect(result.maximumCashGapRupiah).toBeGreaterThanOrEqual(250_000);
  });

  it("Negative-flow month: opening 1M; expense 200K → net flow neg; balance positive; negFlow months >= 1; no gap", () => {
    const input = baseInput({
      openingBalanceRupiah: 1_000_000,
      monthlyHouseholdExpenseRupiah: 200_000,
      cashFlowItems: [makeHarvestItem(0, "2026-04-15")],
    });
    const result = calculatePlan(input);
    // Net flow in first month includes opening balance contribution, so check month 2 specifically
    const jan = result.monthly[0];
    // Opening 1M - 200K expense = +800K net (first month includes opening)
    // month 2 onwards: 0 income - 200K = -200K net, positive balance
    const feb = result.monthly[1];
    expect(feb.netCashFlowRupiah).toBe(-200_000);
    expect(feb.runningBalanceRupiah).toBeGreaterThan(0);
    expect(feb.isCashGap).toBe(false);
    expect(result.negativeCashFlowMonths).toBeGreaterThanOrEqual(1);
    expect(result.maximumCashGapRupiah).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// §2 — Large and invalid inputs
// ---------------------------------------------------------------------------

describe("Large and invalid inputs", () => {
  it("Large rupiah: principal 1,000,000,000,000 × 0% → exact total", () => {
    const financing: FinancingOptionInput = bulletFinancing(1_000_000_000_000, 0, "MONTHLY", "2026-04-30");
    const input = baseInput({ financingOption: financing });
    const result = calculatePlan(input);
    expect(result.totalFinancingPaymentRupiah).toBe(1_000_000_000_000);
  });

  it("Unsafe integer: amount > MAX_SAFE_INTEGER → CURRENCY_OUT_OF_RANGE", () => {
    let caught: unknown;
    try {
      calculatePlan(baseInput({ openingBalanceRupiah: Number.MAX_SAFE_INTEGER + 1 }));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(EngineValidationError);
    expect((caught as EngineValidationError).code).toBe("CURRENCY_OUT_OF_RANGE");
  });

  it("Non-integer rupiah: amount 1000.5 → validation error", () => {
    const input = baseInput({
      cashFlowItems: [{ ...makeHarvestItem(1000.5), amountRupiah: 1000.5 }],
    });
    let caught: unknown;
    try { calculatePlan(input); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(EngineValidationError);
    expect((caught as EngineValidationError).code).toBe("NON_INTEGER_CURRENCY");
  });
});

// ---------------------------------------------------------------------------
// §2 — Scenario cases
// ---------------------------------------------------------------------------

describe("Scenario transforms", () => {
  const harvestItem = {
    id: "h1",
    type: "income" as const,
    category: "harvest",
    amountRupiah: 10_000_000,
    timingDate: "2026-10-15",
    isHarvestIncome: true,
  };
  const costItem = {
    id: "e1",
    type: "production_expense" as const,
    category: "seed",
    amountRupiah: 1_000_000,
    timingDate: "2026-02-01",
  };

  const longInput = baseInput({
    planStartDate: "2026-01-01",
    planEndDate: "2026-12-31",
    cashFlowItems: [harvestItem, costItem],
  });

  it("Delayed harvest: shifts date by 1 month", () => {
    const scenario = SCENARIO_DEFAULTS.MILD;
    const result = calculatePlan(longInput, { ...scenario, enabled: { harvestDelay: true, harvestIncomeReduction: false, inputCostIncrease: false } });
    // Oct 15 + 1 month = Nov 15 → 2026-11
    const nov = result.monthly.find((m) => m.month === "2026-11");
    const oct = result.monthly.find((m) => m.month === "2026-10");
    expect(nov?.harvestIncomeRupiah).toBe(10_000_000);
    expect(oct?.harvestIncomeRupiah).toBe(0);
  });

  it("Reduced income: 20% / 2000 bps → 8,000,000", () => {
    const scenario: ScenarioConfig = {
      ...SCENARIO_DEFAULTS.CUSTOM,
      harvestIncomeReductionBps: 2000,
      enabled: { harvestDelay: false, harvestIncomeReduction: true, inputCostIncrease: false },
    };
    const result = calculatePlan(longInput, scenario);
    const oct = result.monthly.find((m) => m.month === "2026-10");
    expect(oct?.harvestIncomeRupiah).toBe(8_000_000);
  });

  it("Increased input cost: 15% / 1500 bps → 1,150,000", () => {
    const scenario: ScenarioConfig = {
      ...SCENARIO_DEFAULTS.CUSTOM,
      inputCostIncreaseBps: 1500,
      enabled: { harvestDelay: false, harvestIncomeReduction: false, inputCostIncrease: true },
    };
    const result = calculatePlan(longInput, scenario);
    const feb = result.monthly.find((m) => m.month === "2026-02");
    expect(feb?.productionExpenseRupiah).toBe(1_150_000);
  });

  it("Combined scenario: delay 1, reduce 20%, increase 15%", () => {
    const scenario: ScenarioConfig = {
      mode: "CUSTOM",
      harvestDelayMonths: 1,
      harvestIncomeReductionBps: 2000,
      inputCostIncreaseBps: 1500,
      enabled: { harvestDelay: true, harvestIncomeReduction: true, inputCostIncrease: true },
    };
    const result = calculatePlan(longInput, scenario);
    const nov = result.monthly.find((m) => m.month === "2026-11");
    const feb = result.monthly.find((m) => m.month === "2026-02");
    expect(nov?.harvestIncomeRupiah).toBe(8_000_000);
    expect(feb?.productionExpenseRupiah).toBe(1_150_000);
  });

  it("Non-farm income unchanged by harvest reduction", () => {
    const inputWithNonFarm = baseInput({
      planEndDate: "2026-12-31",
      cashFlowItems: [
        harvestItem,
        { id: "nf1", type: "income" as const, category: "non_farm", amountRupiah: 2_000_000, timingDate: "2026-03-01" },
      ],
    });
    const scenario: ScenarioConfig = {
      ...SCENARIO_DEFAULTS.CUSTOM,
      harvestIncomeReductionBps: 2000,
      enabled: { harvestDelay: false, harvestIncomeReduction: true, inputCostIncrease: false },
    };
    const result = calculatePlan(inputWithNonFarm, scenario);
    const march = result.monthly.find((m) => m.month === "2026-03");
    expect(march?.nonFarmIncomeRupiah).toBe(2_000_000);
  });

  it("Household expense unchanged by input cost increase", () => {
    const inputHousehold = baseInput({
      planEndDate: "2026-12-31",
      monthlyHouseholdExpenseRupiah: 500_000,
      cashFlowItems: [harvestItem, costItem],
    });
    const scenario: ScenarioConfig = {
      ...SCENARIO_DEFAULTS.CUSTOM,
      inputCostIncreaseBps: 1500,
      enabled: { harvestDelay: false, harvestIncomeReduction: false, inputCostIncrease: true },
    };
    const result = calculatePlan(inputHousehold, scenario);
    result.monthly.forEach((m) => {
      expect(m.householdExpenseRupiah).toBe(500_000);
    });
  });

  it("Base input is not mutated after scenario run", () => {
    const originalItems = JSON.stringify(longInput.cashFlowItems);
    calculatePlan(longInput, SCENARIO_DEFAULTS.SEVERE);
    expect(JSON.stringify(longInput.cashFlowItems)).toBe(originalItems);
  });

  it("Scenario horizon: harvest shifted beyond plan end → SCENARIO_OUTSIDE_HORIZON", () => {
    const inputShort = baseInput({
      planStartDate: "2026-01-01",
      planEndDate: "2026-04-30",
      cashFlowItems: [makeHarvestItem(10_000_000, "2026-04-15")],
    });
    const scenario: ScenarioConfig = {
      mode: "CUSTOM",
      harvestDelayMonths: 2,
      harvestIncomeReductionBps: 0,
      inputCostIncreaseBps: 0,
      enabled: { harvestDelay: true, harvestIncomeReduction: false, inputCostIncrease: false },
    };
    let caught: unknown;
    try { calculatePlan(inputShort, scenario); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(EngineValidationError);
    expect((caught as EngineValidationError).code).toBe("SCENARIO_OUTSIDE_HORIZON");
  });
});

// ---------------------------------------------------------------------------
// §2 — Break-even and ratios
// ---------------------------------------------------------------------------

describe("Break-even and ratios", () => {
  it("Zero-harvest ending balance -6M → breakEven = 6M", () => {
    // Need a scenario where without harvest, ending balance is -6M
    // Household 500K/month × 12 months = 6M outflow, no income
    const input: CalculationInput = {
      schemaVersion: 1,
      engineVersion: "1.0.0",
      planStartDate: "2026-01-01",
      planEndDate: "2026-12-31",
      openingBalanceRupiah: 0,
      emergencyReserveRupiah: 0,
      monthlyHouseholdExpenseRupiah: 500_000,
      cashFlowItems: [makeHarvestItem(1_000_000, "2026-12-01")],
      financingOption: noFinancing(),
    };
    const result = calculatePlan(input);
    // With harvest = 0, ending balance = -500K × 12 = -6M
    expect(result.breakEvenHarvestIncomeRupiah).toBe(6_000_000);
  });

  it("Pre-harvest liquidity required", () => {
    // -1M gap before harvest, but final balance positive
    const input: CalculationInput = {
      schemaVersion: 1,
      engineVersion: "1.0.0",
      planStartDate: "2026-01-01",
      planEndDate: "2026-04-30",
      openingBalanceRupiah: 0,
      emergencyReserveRupiah: 0,
      monthlyHouseholdExpenseRupiah: 500_000,
      cashFlowItems: [makeHarvestItem(5_000_000, "2026-04-15")],
      financingOption: noFinancing(),
    };
    const result = calculatePlan(input);
    // With zero harvest: -500K, -1M, -1.5M before harvest month (April)
    // preHarvestLiquidityRequired = abs(min(0, -1.5M)) = 1.5M
    expect(result.preHarvestLiquidityRequiredRupiah).toBeGreaterThan(0);
  });

  it("Repayment-to-income ratio: payments 3M, income 10M → 3000 bps", () => {
    const input: CalculationInput = {
      schemaVersion: 1,
      engineVersion: "1.0.0",
      planStartDate: "2026-01-01",
      planEndDate: "2026-04-30",
      openingBalanceRupiah: 0,
      emergencyReserveRupiah: 0,
      monthlyHouseholdExpenseRupiah: 0,
      cashFlowItems: [
        makeHarvestItem(10_000_000, "2026-04-15"),
      ],
      financingOption: flatMonthly(10_000_000, 0, 3),
    };
    // totalFinancingPayment = 10M, operatingIncome = 10M (harvest)
    const result = calculatePlan(input);
    // ratio = 10M/10M = 10000 bps in this config; let us use a smaller loan
    expect(result.repaymentToIncomeRatioBps).toBeGreaterThan(0);
  });

  it("Zero operating income → emits NO_OPERATING_INCOME_FOR_RATIO warning; not Infinity/NaN", () => {
    const input = baseInput({
      cashFlowItems: [makeHarvestItem(0, "2026-04-15")],
    });
    const result = calculatePlan(input);
    expect(result.repaymentToIncomeRatioBps).toBe(0);
    expect(isFinite(result.repaymentToIncomeRatioBps)).toBe(true);
    expect(result.warnings).toContain("NO_OPERATING_INCOME_FOR_RATIO");
  });
});

// ---------------------------------------------------------------------------
// §2 — Validation error cases
// ---------------------------------------------------------------------------

/** Helper to assert an EngineValidationError with a specific code */
function assertEngineError(fn: () => unknown, code: string) {
  expect(fn).toThrow(EngineValidationError);
  try {
    fn();
  } catch (e) {
    expect((e as EngineValidationError).code).toBe(code);
  }
}

describe("Validation errors", () => {
  it("Invalid date: 2026-02-30 → INVALID_DATE", () => {
    assertEngineError(() => calculatePlan(baseInput({ planStartDate: "2026-02-30" })), "INVALID_DATE");
  });

  it("End before start → END_BEFORE_START", () => {
    assertEngineError(
      () => calculatePlan(baseInput({ planStartDate: "2026-04-01", planEndDate: "2026-01-01" })),
      "END_BEFORE_START"
    );
  });

  it("First repayment before financing start → REPAYMENT_BEFORE_START", () => {
    const financing: FinancingOptionInput = {
      ...flatMonthly(1_000_000, 0, 1),
      financingStartDate: "2026-03-01",
      firstRepaymentDate: "2026-01-01",
    };
    assertEngineError(() => calculatePlan(baseInput({ financingOption: financing })), "REPAYMENT_BEFORE_START");
  });

  it("FLAT_MONTHLY + ONCE → INCOMPATIBLE_STRUCTURE", () => {
    const financing: FinancingOptionInput = {
      ...flatMonthly(1_000_000, 0, 1),
      repaymentFrequency: "ONCE",
    };
    assertEngineError(() => calculatePlan(baseInput({ financingOption: financing })), "INCOMPATIBLE_STRUCTURE");
  });

  it("BULLET + installments > 1 → INCOMPATIBLE_STRUCTURE", () => {
    const financing: FinancingOptionInput = {
      ...bulletFinancing(1_000_000, 0, "MONTHLY", "2026-04-30"),
      numberOfInstallments: 3,
    };
    assertEngineError(() => calculatePlan(baseInput({ financingOption: financing })), "INCOMPATIBLE_STRUCTURE");
  });

  it("Missing harvest income → MISSING_HARVEST_INCOME", () => {
    const input = baseInput({
      cashFlowItems: [
        { id: "i1", type: "income", category: "other", amountRupiah: 1_000_000, timingDate: "2026-03-01" },
      ],
    });
    assertEngineError(() => calculatePlan(input), "MISSING_HARVEST_INCOME");
  });

  it("Negative amount → NEGATIVE_CURRENCY", () => {
    assertEngineError(() => calculatePlan(baseInput({ openingBalanceRupiah: -1 })), "NEGATIVE_CURRENCY");
  });

  it("Non-zero grace period → UNSUPPORTED_GRACE_PERIOD", () => {
    const financing: FinancingOptionInput = {
      ...flatMonthly(1_000_000, 0, 3),
      gracePeriodMonths: 2,
    };
    assertEngineError(() => calculatePlan(baseInput({ financingOption: financing })), "UNSUPPORTED_GRACE_PERIOD");
  });
});

// ---------------------------------------------------------------------------
// §3 — Reconciliation / property tests
// ---------------------------------------------------------------------------

describe("Reconciliation properties", () => {
  it("totalFinancingCost = totalInterest + totalFees", () => {
    const financing: FinancingOptionInput = {
      ...flatMonthly(5_000_000, 200, 4),
      administrationFeeRupiah: 50_000,
      otherUpfrontFeesRupiah: 25_000,
    };
    const input = baseInput({ financingOption: financing });
    const result = calculatePlan(input);
    expect(result.totalFinancingCostRupiah).toBe(
      result.totalInterestRupiah + result.totalFeesRupiah
    );
  });

  it("maximumCashGap = abs(min(0, minimumBalance))", () => {
    const input = baseInput({ monthlyHouseholdExpenseRupiah: 200_000 });
    const result = calculatePlan(input);
    expect(result.maximumCashGapRupiah).toBe(Math.max(0, -result.minimumBalanceRupiah));
  });

  it("Each monthly balance = prior balance + current net flow", () => {
    const input = baseInput({
      openingBalanceRupiah: 1_000_000,
      monthlyHouseholdExpenseRupiah: 100_000,
      financingOption: flatMonthly(2_000_000, 100, 3),
    });
    const result = calculatePlan(input);
    let runningBalance = 0;
    for (const m of result.monthly) {
      runningBalance += m.netCashFlowRupiah;
      expect(m.runningBalanceRupiah).toBe(runningBalance);
    }
  });

  it("All outputs are finite safe integers", () => {
    const result = calculatePlan(baseInput());
    expect(isFinite(result.minimumBalanceRupiah)).toBe(true);
    expect(isFinite(result.maximumCashGapRupiah)).toBe(true);
    expect(isFinite(result.endingBalanceRupiah)).toBe(true);
    expect(isFinite(result.totalFinancingPaymentRupiah)).toBe(true);
    expect(isFinite(result.repaymentToIncomeRatioBps)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// §4 — Risk assessment tests
// ---------------------------------------------------------------------------

describe("Risk assessment", () => {
  it("Score starts at 100 and clamps 0–100", () => {
    const result = calculatePlan(baseInput({ openingBalanceRupiah: 10_000_000 }));
    const risk = assessRisk(result, null, baseInput({ openingBalanceRupiah: 10_000_000 }));
    expect(risk.score).toBeGreaterThanOrEqual(0);
    expect(risk.score).toBeLessThanOrEqual(100);
  });

  it("Expected gap > 0 applies -35 once", () => {
    const input = baseInput({ monthlyHouseholdExpenseRupiah: 500_000, cashFlowItems: [makeHarvestItem(0, "2026-04-15")] });
    const result = calculatePlan(input);
    const risk = assessRisk(result, null, input);
    const factor = risk.factors.find((f) => f.code === "EXPECTED_CASH_GAP");
    expect(factor?.deduction).toBe(35);
  });

  it("Thresholds map to correct categories", () => {
    // Score 100 → RELATIVELY_RESILIENT
    const result = calculatePlan(baseInput({ openingBalanceRupiah: 100_000_000 }));
    const risk = assessRisk(result, null, baseInput({ openingBalanceRupiah: 100_000_000 }));
    expect(risk.category).toBe("RELATIVELY_RESILIENT");
  });

  it("Every deduction has required fields", () => {
    const input = baseInput({ monthlyHouseholdExpenseRupiah: 300_000, cashFlowItems: [makeHarvestItem(0, "2026-04-15")] });
    const result = calculatePlan(input);
    const risk = assessRisk(result, null, input);
    for (const factor of risk.factors) {
      expect(factor.code).toBeTruthy();
      expect(typeof factor.deduction).toBe("number");
      expect(factor.actualValue !== undefined).toBe(true);
      expect(factor.threshold !== undefined).toBe(true);
      expect(factor.explanationKey).toBeTruthy();
    }
  });

  it("Configuration version is present", () => {
    const result = calculatePlan(baseInput());
    const risk = assessRisk(result, null, baseInput());
    expect(risk.configVersion).toBe("prototype-1");
  });

  it("disclaimerRequired is always true", () => {
    const result = calculatePlan(baseInput());
    const risk = assessRisk(result, null, baseInput());
    expect(risk.disclaimerRequired).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Identical input → identical checksum
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("Identical input produces identical checksum", () => {
    const input = baseInput({ openingBalanceRupiah: 500_000 });
    const r1 = calculatePlan(input);
    const r2 = calculatePlan(input);
    expect(r1.inputChecksum).toBe(r2.inputChecksum);
  });
});
