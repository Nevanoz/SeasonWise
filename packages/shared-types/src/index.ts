export type Rupiah = number;
export type BasisPoints = number;
export type YearMonth = string; // e.g. "YYYY-MM"

export type CropType = 'rice' | 'corn' | 'chili' | 'coffee' | 'palm_oil';

export interface CropPlanInput {
  cropType: CropType;
  plantingDate: string; // ISO YYYY-MM-DD
  expectedHarvestQuantity: number;
  quantityUnit: string;
  expectedSellingPriceRupiah: Rupiah;
  expectedTotalHarvestIncomeRupiah: Rupiah;
}

export interface CashFlowItem {
  id: string;
  type: 'income' | 'production_expense';
  category: string;
  amountRupiah: Rupiah;
  timingDate: string; // ISO YYYY-MM-DD
  description?: string;
  isHarvestIncome?: boolean;
}

export interface FinancingOptionInput {
  id: string;
  name: string;
  principalRupiah: Rupiah;
  interestRateBps: BasisPoints;
  interestPeriod: 'MONTHLY' | 'ANNUAL';
  administrationFeeRupiah: Rupiah;
  otherUpfrontFeesRupiah: Rupiah;
  financingStartDate: string; // ISO YYYY-MM-DD
  gracePeriodMonths: number; // MVP: 0
  numberOfInstallments: number;
  repaymentFrequency: 'MONTHLY' | 'ONCE';
  repaymentStructure: 'FLAT_MONTHLY' | 'BULLET';
  firstRepaymentDate: string; // ISO YYYY-MM-DD
}

export interface ScenarioConfig {
  mode: 'EXPECTED' | 'MILD' | 'SEVERE' | 'CUSTOM';
  harvestDelayMonths: number;
  harvestIncomeReductionBps: number;
  inputCostIncreaseBps: number;
  enabled: {
    harvestDelay: boolean;
    harvestIncomeReduction: boolean;
    inputCostIncrease: boolean;
  };
}

export interface CalculationInput {
  schemaVersion: 1;
  engineVersion: '1.0.0';
  planStartDate: string; // ISO YYYY-MM-DD
  planEndDate: string; // ISO YYYY-MM-DD
  openingBalanceRupiah: Rupiah;
  emergencyReserveRupiah: Rupiah;
  monthlyHouseholdExpenseRupiah: Rupiah;
  cashFlowItems: CashFlowItem[];
  financingOption: FinancingOptionInput | null;
}

export interface MonthlyCashFlow {
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

export interface CashFlowResult {
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

export interface RiskAssessmentFactor {
  code: string;
  deduction: number;
  actualValue: number | string;
  threshold: number | string;
  explanationKey: string;
}

export interface RiskAssessment {
  score: number;
  category: 'RELATIVELY_RESILIENT' | 'NEEDS_ADJUSTMENT' | 'HIGH_CASH_FLOW_RISK';
  configVersion: 'prototype-1';
  factors: RiskAssessmentFactor[];
  disclaimerRequired: true;
}
