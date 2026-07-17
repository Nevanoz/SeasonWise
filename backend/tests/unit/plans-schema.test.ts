import { describe, expect, it } from "vitest";
import { PlanInputSchema } from "../../src/schemas/plans.js";

const validPlan = {
  schemaVersion: 1, title: "Rencana Padi", region: { provinceCode: "32", regencyCode: "32.04", districtCode: null },
  cropPlan: { cropType: "rice", templateVersion: "v1", plantingDate: "2026-07-01", estimatedHarvestDate: "2026-10-20", cycleDurationDays: 112, productionPhases: [], expectedHarvestQuantity: 3000, quantityUnit: "kg", expectedSellingPriceRupiah: 6500, assumptions: [] },
  cashFlowItems: [{ type: "income", category: "harvest", amountRupiah: 19500000, timingDate: "2026-10-20", isHarvestIncome: true }],
  monthlyHouseholdExpenseRupiah: 1000000, openingBalanceRupiah: 1000000, emergencyReserveRupiah: 500000,
  financingOptions: [{ name: "Bullet", principalRupiah: 12000000, interestRateBps: 1200, interestPeriod: "ANNUAL", administrationFeeRupiah: 100000, otherUpfrontFeesRupiah: 0, financingStartDate: "2026-07-01", gracePeriodMonths: 0, numberOfInstallments: 1, repaymentFrequency: "ONCE", repaymentStructure: "BULLET", firstRepaymentDate: "2026-11-15" }]
};

describe("plan schema", () => {
  it("accepts a valid rice plan", () => expect(PlanInputSchema.parse(validPlan).title).toBe("Rencana Padi"));
  it("rejects unsafe currency", () => expect(() => PlanInputSchema.parse({ ...validPlan, openingBalanceRupiah: Number.MAX_SAFE_INTEGER + 1 })).toThrow());
  it("rejects a plan without harvest income", () => expect(() => PlanInputSchema.parse({ ...validPlan, cashFlowItems: [] })).toThrow());
  it("rejects inconsistent bullet payments", () => expect(() => PlanInputSchema.parse({ ...validPlan, financingOptions: [{ ...validPlan.financingOptions[0], numberOfInstallments: 2 }] })).toThrow());
});