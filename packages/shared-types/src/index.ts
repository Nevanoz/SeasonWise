export type CurrencyRupiah = number;

export type CropType = "rice" | "corn" | "chili" | "coffee" | "palm_oil";

export interface RegionSelection {
  provinceCode: string;
  regencyCode: string;
  districtCode: string | null;
}

export interface CropPlanInput {
  cropType: CropType;
  plantingDate: string; // YYYY-MM-DD
  estimatedHarvestDate: string; // YYYY-MM-DD
  cycleDurationDays: number;
  expectedHarvestQuantity: number;
  quantityUnit: string;
  expectedSellingPriceRupiah: CurrencyRupiah;
}

export interface CashFlowItemForm {
  id: string;
  type: "income" | "production_expense";
  category: string;
  amountRupiah: CurrencyRupiah;
  timingDate: string; // YYYY-MM-DD
  description?: string;
  isHarvestIncome?: boolean;
}

export interface PlanFormValues {
  schemaVersion: 1;
  title: string;
  region: RegionSelection;
  cropPlan: CropPlanInput;
  cashFlowItems: CashFlowItemForm[];
  monthlyHouseholdExpenseRupiah: CurrencyRupiah;
  openingBalanceRupiah: CurrencyRupiah;
  emergencyReserveRupiah: CurrencyRupiah;
  financingOptions: FinancingOptionInput[];
  notes?: string;
}

export interface FinancingOptionInput {
  id: string;
  name: string;
  principalRupiah: CurrencyRupiah;
  interestRateBps: number;
  interestPeriod: "MONTHLY" | "ANNUAL";
  administrationFeeRupiah: CurrencyRupiah;
  otherUpfrontFeesRupiah: CurrencyRupiah;
  financingStartDate: string; // YYYY-MM-DD
  gracePeriodMonths: number; // MVP 0
  numberOfInstallments: number;
  repaymentFrequency: "MONTHLY" | "ONCE";
  repaymentStructure: "FLAT_MONTHLY" | "BULLET";
  firstRepaymentDate: string; // YYYY-MM-DD
}

export interface CashFlowItem {
  id: string;
  type: "income" | "production_expense";
  category: string;
  amountRupiah: CurrencyRupiah;
  timingDate: string; // YYYY-MM-DD
  description?: string;
  isHarvestIncome?: boolean;
}

export interface CalculationInput {
  schemaVersion: 1;
  engineVersion: "1.0.0";
  planStartDate: string; // YYYY-MM-DD
  planEndDate: string; // YYYY-MM-DD
  openingBalanceRupiah: CurrencyRupiah;
  emergencyReserveRupiah: CurrencyRupiah;
  monthlyHouseholdExpenseRupiah: CurrencyRupiah;
  cashFlowItems: CashFlowItem[];
  financingOption: FinancingOptionInput;
}

export interface MonthlyCashFlow {
  month: string; // YYYY-MM
  operatingIncomeRupiah: CurrencyRupiah;
  harvestIncomeRupiah: CurrencyRupiah;
  nonFarmIncomeRupiah: CurrencyRupiah;
  financingInflowRupiah: CurrencyRupiah;
  productionExpenseRupiah: CurrencyRupiah;
  householdExpenseRupiah: CurrencyRupiah;
  financingFeeRupiah: CurrencyRupiah;
  financingPaymentRupiah: CurrencyRupiah;
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
  firstCashGapMonth: string | null; // YYYY-MM or null
  totalFinancingPaymentRupiah: CurrencyRupiah;
  totalInterestRupiah: CurrencyRupiah;
  totalFeesRupiah: CurrencyRupiah;
  totalFinancingCostRupiah: CurrencyRupiah;
  breakEvenHarvestIncomeRupiah: CurrencyRupiah;
  preHarvestLiquidityRequiredRupiah: CurrencyRupiah;
  repaymentToIncomeRatioBps: number;
  negativeCashFlowMonths: number;
  endingBalanceRupiah: number;
  assumptions: string[];
  warnings: string[];
}

export interface RiskFactor {
  code: string;
  deduction: number;
  actualValue: number | string;
  threshold: number | string;
  explanationKey: string;
}

export interface RiskAssessment {
  score: number;
  category: "RELATIVELY_RESILIENT" | "NEEDS_ADJUSTMENT" | "HIGH_CASH_FLOW_RISK";
  configVersion: string;
  factors: RiskFactor[];
  disclaimerRequired: boolean;
}

export interface CashFlowChartPoint {
  month: string; // YYYY-MM
  incomeRupiah: number;
  financingInflowRupiah: number;
  productionExpenseRupiah: number;
  householdExpenseRupiah: number;
  financingPaymentRupiah: number;
  netCashFlowRupiah: number;
  runningBalanceRupiah: number;
  isCashGap: boolean;
}
