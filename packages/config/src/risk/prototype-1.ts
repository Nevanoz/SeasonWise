export const RISK_PROTOTYPE_1 = {
  version: "prototype-1" as const,
  baseScore: 100,
  rules: {
    expectedCashGap: { code: "EXPECTED_GAP", deduction: 35, explanationKey: "risk.expectedGap" },
    stressCreatesGap: { code: "STRESS_GAP", deduction: 20, explanationKey: "risk.stressCreatesGap" },
    repaymentToIncome: [
      { minBps: 2000, maxBps: 3500, deduction: 5, explanationKey: "risk.rti.low" },
      { minBps: 3500, maxBps: 5000, deduction: 10, explanationKey: "risk.rti.medium" },
      { minBps: 5000, maxBps: Infinity, deduction: 15, explanationKey: "risk.rti.high" },
    ],
    liquidityMonths: [
      { minMonths: 1, maxMonths: 2, deduction: 5, explanationKey: "risk.liquidity.low" },
      { minMonths: 0, maxMonths: 1, deduction: 10, explanationKey: "risk.liquidity.critical" },
    ],
    expectedEndingBalance: [
      { minMonths: 0, maxMonths: 1, deduction: 5, explanationKey: "risk.endingBalance.low" },
      { minMonths: -Infinity, maxMonths: 0, deduction: 10, explanationKey: "risk.endingBalance.negative" },
    ],
    financingCostRatio: { thresholdBps: 3000, deduction: 5, explanationKey: "risk.costRatio" },
    sensitivityGaps: { deductionPerGap: 5, maxDeduction: 10, explanationKey: "risk.sensitivity" },
  }
};
