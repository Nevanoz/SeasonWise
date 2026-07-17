import type { ChatRequest } from "../../src/schemas/chat.js";

export function chatRequest(): ChatRequest {
  return {
    message: "Mengapa gap terjadi?",
    locale: "id-ID",
    context: {
      page: "results",
      cropPlanSummary: { cropType: "rice", plantingDate: "2026-07-01", estimatedHarvestDate: "2026-10-20", region: "Jawa Barat" },
      financingSummary: { structure: "FLAT_MONTHLY", repaymentTiming: "bulanan", totalPaymentRupiah: 12480000 },
      expectedResult: { minimumBalanceRupiah: 480000, maximumCashGapRupiah: 0, firstCashGapMonth: null, totalFinancingPaymentRupiah: 12480000, totalFinancingCostRupiah: 580000, repaymentToIncomeRatioBps: 6400, endingBalanceRupiah: 7120000 },
      scenarioResults: [{ id: "delay-1", label: "Panen terlambat", result: { minimumBalanceRupiah: -4140000, maximumCashGapRupiah: 4140000, firstCashGapMonth: "2026-10", totalFinancingPaymentRupiah: 12480000, totalFinancingCostRupiah: 580000, repaymentToIncomeRatioBps: 6400, endingBalanceRupiah: 7120000 } }],
      comparisonResult: null,
      externalDataSummary: { source: "Synthetic MusimAman demo dataset", status: "mock", dataDate: "2026-07-01", commodity: "rice", unit: "IDR_PER_KG" },
      allowedKnowledgeSections: ["cash_gap", "scenario", "assumptions", "disclaimer"]
    }
  };
}