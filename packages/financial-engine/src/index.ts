import {
  Rupiah,
  BasisPoints,
  YearMonth,
  CalculationInput,
  CashFlowResult,
  MonthlyCashFlow,
  FinancingOptionInput,
  ScenarioConfig,
  RiskAssessment,
  RiskAssessmentFactor,
  CashFlowItem,
} from '@musimaman/shared-types';
import { RISK_CONFIG } from '@musimaman/config';

// --- DATE HELPERS ---

export function parseYearMonth(dateStr: string): YearMonth {
  // e.g. "2024-05-12" -> "2024-05"
  return dateStr.substring(0, 7);
}

export function addCalendarMonths(dateStr: string, months: number): string {
  if (months === 0) return dateStr;
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // 0-indexed
  const d = parseInt(parts[2], 10);

  const date = new Date(Date.UTC(y, m + months, 1));
  const maxDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  const targetDay = Math.min(d, maxDay);

  const finalYear = date.getUTCFullYear();
  const finalMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const finalDay = String(targetDay).padStart(2, '0');

  return `${finalYear}-${finalMonth}-${finalDay}`;
}

export function countCalendarMonths(startStr: string, endStr: string): number {
  const startParts = startStr.split('-');
  const endParts = endStr.split('-');
  const startYear = parseInt(startParts[0], 10);
  const startMonth = parseInt(startParts[1], 10);
  const endYear = parseInt(endParts[0], 10);
  const endMonth = parseInt(endParts[1], 10);

  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

export function getMonthRange(startStr: string, endStr: string): YearMonth[] {
  const startYM = parseYearMonth(startStr);
  const endYM = parseYearMonth(endStr);

  const startParts = startYM.split('-');
  const endParts = endYM.split('-');
  let currY = parseInt(startParts[0], 10);
  let currM = parseInt(startParts[1], 10);
  const targetY = parseInt(endParts[0], 10);
  const targetM = parseInt(endParts[1], 10);

  const range: YearMonth[] = [];
  while (currY < targetY || (currY === targetY && currM <= targetM)) {
    const mStr = String(currM).padStart(2, '0');
    range.push(`${currY}-${mStr}`);
    currM++;
    if (currM > 12) {
      currM = 1;
      currY++;
    }
  }
  return range;
}

// --- AMORTIZATION SCHEDULE GENERATOR ---

export interface RepaymentInstallment {
  date: string;
  principalPaid: Rupiah;
  interestPaid: Rupiah;
  totalPayment: Rupiah;
}

export function generateFinancingSchedule(option: FinancingOptionInput): {
  installments: RepaymentInstallment[];
  disbursementInflow: Rupiah;
  feesOutflow: Rupiah;
  totalInterest: Rupiah;
} {
  const principal = option.principalRupiah;
  const rateDecimal = option.interestRateBps / 10000;
  const monthlyRate = option.interestPeriod === 'MONTHLY' ? rateDecimal : rateDecimal / 12;

  const disbursementInflow = principal;
  const feesOutflow = option.administrationFeeRupiah + option.otherUpfrontFeesRupiah;
  const installments: RepaymentInstallment[] = [];
  let totalInterest = 0;

  if (option.repaymentStructure === 'FLAT_MONTHLY') {
    const periodCount = option.numberOfInstallments;
    // Round interest canonical way
    totalInterest = Math.round(principal * monthlyRate * periodCount);
    const totalRepayment = principal + totalInterest;

    const baseInstallment = Math.floor(totalRepayment / periodCount);
    const remainder = totalRepayment % periodCount;

    let currentDate = option.firstRepaymentDate;
    for (let i = 0; i < periodCount; i++) {
      // remainder is distributed as +1 to the first few installments
      const totalPayment = baseInstallment + (i < remainder ? 1 : 0);
      
      // Interest is split evenly per installment
      const interestPaid = Math.round(totalInterest / periodCount);
      const principalPaid = totalPayment - interestPaid;

      installments.push({
        date: currentDate,
        principalPaid,
        interestPaid,
        totalPayment,
      });

      currentDate = addCalendarMonths(currentDate, 1);
    }
  } else if (option.repaymentStructure === 'BULLET') {
    const monthsOutstanding = countCalendarMonths(option.financingStartDate, option.firstRepaymentDate);
    const interestPeriods = option.interestPeriod === 'MONTHLY'
      ? Math.max(1, monthsOutstanding)
      : Math.max(1, monthsOutstanding) / 12;

    totalInterest = Math.round(principal * rateDecimal * interestPeriods);
    const bulletPayment = principal + totalInterest;

    installments.push({
      date: option.firstRepaymentDate,
      principalPaid: principal,
      interestPaid: totalInterest,
      totalPayment: bulletPayment,
    });
  }

  return {
    installments,
    disbursementInflow,
    feesOutflow,
    totalInterest,
  };
}

// --- CORE CALCULATION ENGINE ---

export function calculatePlan(input: CalculationInput): CashFlowResult {
  const months = getMonthRange(input.planStartDate, input.planEndDate);
  
  // Amortization
  let installments: RepaymentInstallment[] = [];
  let totalInterest = 0;
  let totalFees = 0;
  let totalFinancingPayment = 0;
  let hasFinancing = false;

  if (input.financingOption) {
    const schedule = generateFinancingSchedule(input.financingOption);
    installments = schedule.installments;
    totalInterest = schedule.totalInterest;
    totalFees = schedule.feesOutflow;
    totalFinancingPayment = installments.reduce((acc, inst) => acc + inst.totalPayment, 0);
    hasFinancing = true;
  }

  const monthlyLedger: MonthlyCashFlow[] = [];
  let runningBalance = 0;

  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const isFirstMonth = i === 0;

    // Filters cash flow items in this month
    const monthItems = input.cashFlowItems.filter(item => parseYearMonth(item.timingDate) === m);

    // Summing cash flows
    let harvestIncome = 0;
    let nonFarmIncome = 0;
    let productionExpense = 0;

    for (const item of monthItems) {
      if (item.type === 'income') {
        if (item.isHarvestIncome) {
          harvestIncome += item.amountRupiah;
        } else {
          nonFarmIncome += item.amountRupiah;
        }
      } else if (item.type === 'production_expense') {
        productionExpense += item.amountRupiah;
      }
    }

    const operatingIncome = harvestIncome + nonFarmIncome;

    // Financing inflow (disbursement) in this month
    let financingInflow = 0;
    let financingFee = 0;
    if (input.financingOption && parseYearMonth(input.financingOption.financingStartDate) === m) {
      financingInflow = input.financingOption.principalRupiah;
      financingFee = input.financingOption.administrationFeeRupiah + input.financingOption.otherUpfrontFeesRupiah;
    }

    // Financing payments in this month
    let financingPayment = 0;
    const monthInstallments = installments.filter(inst => parseYearMonth(inst.date) === m);
    for (const inst of monthInstallments) {
      financingPayment += inst.totalPayment;
    }

    // Household expense
    const householdExpense = input.monthlyHouseholdExpenseRupiah;

    // Opening balances
    const initialOpening = isFirstMonth ? input.openingBalanceRupiah : 0;
    const initialReserve = isFirstMonth ? input.emergencyReserveRupiah : 0;

    // Ledger Calculation
    const priorRunningBalance = isFirstMonth ? 0 : monthlyLedger[i - 1].runningBalanceRupiah;

    const netCashFlow =
      initialOpening +
      initialReserve +
      operatingIncome +
      financingInflow -
      productionExpense -
      householdExpense -
      financingFee -
      financingPayment;

    runningBalance = priorRunningBalance + netCashFlow;

    monthlyLedger.push({
      month: m,
      operatingIncomeRupiah: operatingIncome,
      harvestIncomeRupiah: harvestIncome,
      nonFarmIncomeRupiah: nonFarmIncome,
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

  // Calculate overall metrics
  const runningBalances = monthlyLedger.map(m => m.runningBalanceRupiah);
  const minimumBalance = Math.min(...runningBalances);
  const maximumCashGap = Math.abs(Math.min(0, minimumBalance));
  
  let firstCashGapMonth: YearMonth | null = null;
  const firstGap = monthlyLedger.find(m => m.runningBalanceRupiah < 0);
  if (firstGap) {
    firstCashGapMonth = firstGap.month;
  }

  const negativeCashFlowMonths = monthlyLedger.filter(m => m.netCashFlowRupiah < 0).length;
  const endingBalance = monthlyLedger[monthlyLedger.length - 1]?.runningBalanceRupiah || 0;

  // Repayment to income ratio Bps
  const totalOperatingIncome = monthlyLedger.reduce((acc, m) => acc + m.operatingIncomeRupiah, 0);
  const repaymentToIncomeRatioBps = totalOperatingIncome > 0
    ? Math.round((totalFinancingPayment / totalOperatingIncome) * 10000)
    : 0;

  // Break-even harvest income
  // Compute ledger with harvest incomes = 0
  const inputWithoutHarvest: CalculationInput = {
    ...input,
    cashFlowItems: input.cashFlowItems.map(item =>
      item.isHarvestIncome ? { ...item, amountRupiah: 0 } : item
    ),
  };
  const resultWithoutHarvest = calculatePlanInternal(inputWithoutHarvest, installments);
  const endingBalanceWithZeroHarvest = resultWithoutHarvest.endingBalanceRupiah;
  const breakEvenHarvestIncome = Math.max(0, -endingBalanceWithZeroHarvest);

  // Pre-harvest liquidity required
  // First harvest month
  const harvestMonths = input.cashFlowItems
    .filter(item => item.isHarvestIncome)
    .map(item => parseYearMonth(item.timingDate));
  
  let preHarvestLiquidityRequired = 0;
  if (harvestMonths.length > 0) {
    const firstHarvestMonth = harvestMonths.sort()[0];
    const preHarvestLedger = monthlyLedger.filter(m => m.month < firstHarvestMonth);
    if (preHarvestLedger.length > 0) {
      const minPreHarvest = Math.min(...preHarvestLedger.map(m => m.runningBalanceRupiah));
      preHarvestLiquidityRequired = Math.abs(Math.min(0, minPreHarvest));
    }
  }

  // Build assumptions list
  const assumptions: string[] = [];
  assumptions.push(`Saldo awal kas petani adalah Rp ${input.openingBalanceRupiah.toLocaleString('id-ID')}.`);
  assumptions.push(`Dana darurat awal yang dipersiapkan adalah Rp ${input.emergencyReserveRupiah.toLocaleString('id-ID')}.`);
  assumptions.push(`Kebutuhan biaya rumah tangga minimum tetap konsisten Rp ${input.monthlyHouseholdExpenseRupiah.toLocaleString('id-ID')} per bulan.`);
  if (hasFinancing && input.financingOption) {
    const opt = input.financingOption;
    assumptions.push(`Menggunakan pembiayaan ${opt.name} sebesar Rp ${opt.principalRupiah.toLocaleString('id-ID')}`);
    assumptions.push(`Suku bunga pembiayaan adalah ${(opt.interestRateBps / 100).toFixed(2)}% per ${opt.interestPeriod === 'MONTHLY' ? 'bulan' : 'tahun'}.`);
    if (opt.repaymentStructure === 'FLAT_MONTHLY') {
      assumptions.push(`Skema pembayaran cicilan bulanan flat sebanyak ${opt.numberOfInstallments} kali.`);
    } else {
      assumptions.push(`Skema pembayaran cicilan pascapanen (bullet) satu kali pelunasan.`);
    }
  }

  const warnings: string[] = [];
  if (minimumBalance < 0) {
    warnings.push(`Terdeteksi potensi defisit kas (cash gap) hingga Rp ${maximumCashGap.toLocaleString('id-ID')} yang dimulai pada bulan ${firstCashGapMonth}.`);
  }
  if (repaymentToIncomeRatioBps > 3500) {
    warnings.push(`Rasio beban cicilan terhadap pendapatan sangat tinggi (${(repaymentToIncomeRatioBps / 100).toFixed(1)}%). Batas aman disarankan < 35%.`);
  }

  return {
    engineVersion: '1.0.0',
    inputChecksum: generateChecksum(input),
    monthly: monthlyLedger,
    minimumBalanceRupiah: minimumBalance,
    maximumCashGapRupiah: maximumCashGap,
    firstCashGapMonth,
    totalFinancingPaymentRupiah: totalFinancingPayment,
    totalInterestRupiah: totalInterest,
    totalFeesRupiah: totalFees,
    totalFinancingCostRupiah: totalInterest + totalFees,
    breakEvenHarvestIncomeRupiah: breakEvenHarvestIncome,
    preHarvestLiquidityRequiredRupiah: preHarvestLiquidityRequired,
    repaymentToIncomeRatioBps,
    negativeCashFlowMonths,
    endingBalanceRupiah: endingBalance,
    assumptions,
    warnings,
  };
}

// Internal version that uses precomputed schedule to avoid infinite loop
function calculatePlanInternal(input: CalculationInput, precomputedInstallments: RepaymentInstallment[]) {
  const months = getMonthRange(input.planStartDate, input.planEndDate);
  const monthlyLedger: MonthlyCashFlow[] = [];
  let runningBalance = 0;

  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const isFirstMonth = i === 0;

    const monthItems = input.cashFlowItems.filter(item => parseYearMonth(item.timingDate) === m);
    let harvestIncome = 0;
    let nonFarmIncome = 0;
    let productionExpense = 0;

    for (const item of monthItems) {
      if (item.type === 'income') {
        if (item.isHarvestIncome) {
          harvestIncome += item.amountRupiah;
        } else {
          nonFarmIncome += item.amountRupiah;
        }
      } else if (item.type === 'production_expense') {
        productionExpense += item.amountRupiah;
      }
    }

    const operatingIncome = harvestIncome + nonFarmIncome;

    let financingInflow = 0;
    let financingFee = 0;
    if (input.financingOption && parseYearMonth(input.financingOption.financingStartDate) === m) {
      financingInflow = input.financingOption.principalRupiah;
      financingFee = input.financingOption.administrationFeeRupiah + input.financingOption.otherUpfrontFeesRupiah;
    }

    let financingPayment = 0;
    const monthInstallments = precomputedInstallments.filter(inst => parseYearMonth(inst.date) === m);
    for (const inst of monthInstallments) {
      financingPayment += inst.totalPayment;
    }

    const householdExpense = input.monthlyHouseholdExpenseRupiah;
    const initialOpening = isFirstMonth ? input.openingBalanceRupiah : 0;
    const initialReserve = isFirstMonth ? input.emergencyReserveRupiah : 0;

    const priorRunningBalance = isFirstMonth ? 0 : monthlyLedger[i - 1].runningBalanceRupiah;
    const netCashFlow =
      initialOpening +
      initialReserve +
      operatingIncome +
      financingInflow -
      productionExpense -
      householdExpense -
      financingFee -
      financingPayment;

    runningBalance = priorRunningBalance + netCashFlow;

    monthlyLedger.push({
      month: m,
      operatingIncomeRupiah: operatingIncome,
      harvestIncomeRupiah: harvestIncome,
      nonFarmIncomeRupiah: nonFarmIncome,
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

  const runningBalances = monthlyLedger.map(m => m.runningBalanceRupiah);
  const endingBalance = monthlyLedger[monthlyLedger.length - 1]?.runningBalanceRupiah || 0;

  return {
    endingBalanceRupiah: endingBalance,
    minimumBalanceRupiah: Math.min(...runningBalances),
  };
}

function generateChecksum(input: CalculationInput): string {
  // Simple checksum representation
  const str = JSON.stringify({
    start: input.planStartDate,
    end: input.planEndDate,
    open: input.openingBalanceRupiah,
    reserve: input.emergencyReserveRupiah,
    hh: input.monthlyHouseholdExpenseRupiah,
    items: input.cashFlowItems.map(i => `${i.id}:${i.amountRupiah}:${i.timingDate}`),
    loan: input.financingOption ? `${input.financingOption.id}:${input.financingOption.principalRupiah}` : '',
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'checksum_' + Math.abs(hash).toString(16);
}

// --- SCENARIO TRANSFORMER ---

export function transformScenario(input: CalculationInput, config: ScenarioConfig): CalculationInput {
  // Ordered transforms:
  // 1. INPUT_COST_INCREASE
  // 2. HARVEST_INCOME_REDUCTION
  // 3. HARVEST_DELAY

  // Deep clone items
  let items: CashFlowItem[] = JSON.parse(JSON.stringify(input.cashFlowItems));

  // 1. INPUT_COST_INCREASE (only production_expense items)
  if (config.enabled.inputCostIncrease && config.inputCostIncreaseBps > 0) {
    const factor = 1 + config.inputCostIncreaseBps / 10000;
    items = items.map(item => {
      if (item.type === 'production_expense') {
        return {
          ...item,
          amountRupiah: Math.round(item.amountRupiah * factor),
        };
      }
      return item;
    });
  }

  // 2. HARVEST_INCOME_REDUCTION (only isHarvestIncome items)
  if (config.enabled.harvestIncomeReduction && config.harvestIncomeReductionBps > 0) {
    const factor = 1 - config.harvestIncomeReductionBps / 10000;
    items = items.map(item => {
      if (item.type === 'income' && item.isHarvestIncome) {
        return {
          ...item,
          amountRupiah: Math.round(item.amountRupiah * factor),
        };
      }
      return item;
    });
  }

  // 3. HARVEST_DELAY (only isHarvestIncome items)
  if (config.enabled.harvestDelay && config.harvestDelayMonths > 0) {
    items = items.map(item => {
      if (item.type === 'income' && item.isHarvestIncome) {
        return {
          ...item,
          timingDate: addCalendarMonths(item.timingDate, config.harvestDelayMonths),
        };
      }
      return item;
    });
  }

  return {
    ...input,
    cashFlowItems: items,
  };
}

// --- RISK ASSESSMENT ---

export function calculateResilienceScore(
  baseInput: CalculationInput,
  expectedResult: CashFlowResult,
  mildResult: CashFlowResult,
  severeResult: CashFlowResult,
  customResult: CashFlowResult | null
): RiskAssessment {
  let score = 100;
  const factors: RiskAssessmentFactor[] = [];

  // Factor 1: Expected scenario maximum cash gap > 0 (Defisit Kas terjadi di kondisi normal)
  if (expectedResult.maximumCashGapRupiah > 0) {
    score -= 35;
    factors.push({
      code: 'EXPECTED_CASH_GAP',
      deduction: 35,
      actualValue: expectedResult.maximumCashGapRupiah,
      threshold: 0,
      explanationKey: 'Defisit kas terdeteksi pada skenario normal.',
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
      code: 'STRESS_INCREASES_GAP',
      deduction: 20,
      actualValue: maxStressGap,
      threshold: expectedResult.maximumCashGapRupiah,
      explanationKey: 'Uji stres memperparah defisit kas.',
    });
  }

  // Factor 3: Repayment-to-income
  const ratio = expectedResult.repaymentToIncomeRatioBps;
  if (ratio > 5000) {
    score -= 15;
    factors.push({
      code: 'REPAYMENT_TO_INCOME_CRITICAL',
      deduction: 15,
      actualValue: `${(ratio / 100).toFixed(1)}%`,
      threshold: '50.0%',
      explanationKey: 'Rasio cicilan terhadap pendapatan melebihi batas kritis 50%.',
    });
  } else if (ratio > 3500) {
    score -= 10;
    factors.push({
      code: 'REPAYMENT_TO_INCOME_SEVERE',
      deduction: 10,
      actualValue: `${(ratio / 100).toFixed(1)}%`,
      threshold: '35.0%',
      explanationKey: 'Rasio cicilan terhadap pendapatan melebihi batas aman 35%.',
    });
  } else if (ratio > 2000) {
    score -= 5;
    factors.push({
      code: 'REPAYMENT_TO_INCOME_MILD',
      deduction: 5,
      actualValue: `${(ratio / 100).toFixed(1)}%`,
      threshold: '20.0%',
      explanationKey: 'Rasio cicilan terhadap pendapatan di atas 20%.',
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
        code: 'RESERVE_COVERAGE_CRITICAL',
        deduction: 10,
        actualValue: `${coverageMonths.toFixed(2)} bulan`,
        threshold: '1.00 bulan',
        explanationKey: 'Dana cadangan awal tidak cukup menutupi pengeluaran keluarga 1 bulan.',
      });
    } else if (coverageMonths < 2) {
      score -= 5;
      factors.push({
        code: 'RESERVE_COVERAGE_MILD',
        deduction: 5,
        actualValue: `${coverageMonths.toFixed(2)} bulan`,
        threshold: '2.00 bulan',
        explanationKey: 'Dana cadangan awal kurang dari 2 bulan kebutuhan keluarga.',
      });
    }
  }

  // Factor 5: Expected ending balance
  const endingBalance = expectedResult.endingBalanceRupiah;
  if (endingBalance <= 0) {
    score -= 10;
    factors.push({
      code: 'ENDING_BALANCE_NEGATIVE',
      deduction: 10,
      actualValue: endingBalance,
      threshold: 0,
      explanationKey: 'Proyeksi saldo kas akhir bernilai negatif atau nol.',
    });
  } else if (householdExpense > 0 && endingBalance < householdExpense) {
    score -= 5;
    factors.push({
      code: 'ENDING_BALANCE_LOW',
      deduction: 5,
      actualValue: endingBalance,
      threshold: householdExpense,
      explanationKey: 'Saldo kas akhir kurang dari biaya 1 bulan rumah tangga.',
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
          code: 'HIGH_FINANCING_COST',
          deduction: 5,
          actualValue: `${((financingCost / principal) * 100).toFixed(1)}%`,
          threshold: '30.0%',
          explanationKey: 'Total biaya pinjaman (bunga + biaya) melebihi 30% dari pokok pinjaman.',
        });
      }
    }
  }

  // Factor 7: Gaps in sensitivity testing
  // We check if separate triggers (delay, reduction, cost increase) individually create gap.
  // Delay only
  const delayOnlyConfig: ScenarioConfig = {
    mode: 'CUSTOM',
    harvestDelayMonths: 1,
    harvestIncomeReductionBps: 0,
    inputCostIncreaseBps: 0,
    enabled: { harvestDelay: true, harvestIncomeReduction: false, inputCostIncrease: false },
  };
  const delayResult = calculatePlan(transformScenario(baseInput, delayOnlyConfig));
  
  // Reduction only
  const reductionOnlyConfig: ScenarioConfig = {
    mode: 'CUSTOM',
    harvestDelayMonths: 0,
    harvestIncomeReductionBps: 1000, // 10%
    inputCostIncreaseBps: 0,
    enabled: { harvestDelay: false, harvestIncomeReduction: true, inputCostIncrease: false },
  };
  const reductionResult = calculatePlan(transformScenario(baseInput, reductionOnlyConfig));

  // Cost increase only
  const costOnlyConfig: ScenarioConfig = {
    mode: 'CUSTOM',
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
      code: 'SENSITIVITY_GAPS',
      deduction,
      actualValue: sensitivityGapCount,
      threshold: 0,
      explanationKey: `Pemberian stressor mandiri menimbulkan cash gap baru (${sensitivityGapCount} sensitivitas).`,
    });
  }

  score = Math.max(0, Math.min(100, score));

  let category: RiskAssessment['category'] = 'RELATIVELY_RESILIENT';
  if (score < 50) {
    category = 'HIGH_CASH_FLOW_RISK';
  } else if (score < 75) {
    category = 'NEEDS_ADJUSTMENT';
  }

  return {
    score,
    category,
    configVersion: 'prototype-1',
    factors,
    disclaimerRequired: true,
  };
}
