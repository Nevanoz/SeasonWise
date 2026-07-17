import { z } from "zod";

// Helper for ISO Date string validation (YYYY-MM-DD)
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Format tanggal harus YYYY-MM-DD",
});

// Helper for currency values which must be non-negative safe integers
const safeRupiahSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER, {
    message: "Nilai nominal melebihi batas maksimum yang aman",
  });

export const RegionSelectionSchema = z.object({
  provinceCode: z.string().min(1, "Provinsi harus dipilih"),
  regencyCode: z.string().min(1, "Kabupaten/Kota harus dipilih"),
  districtCode: z.string().nullable().optional(),
});

export const CropPlanInputSchema = z
  .object({
    cropType: z.enum(["rice", "corn", "chili", "coffee", "palm_oil"], {
      errorMap: () => ({ message: "Jenis tanaman tidak didukung" }),
    }),
    plantingDate: dateStringSchema,
    estimatedHarvestDate: dateStringSchema,
    cycleDurationDays: z.number().int().positive("Durasi siklus harus positif"),
    expectedHarvestQuantity: z.number().nonnegative("Kuantitas panen tidak boleh negatif"),
    quantityUnit: z.string().min(1, "Satuan kuantitas harus diisi"),
    expectedSellingPriceRupiah: safeRupiahSchema,
  })
  .refine(
    (data) => {
      const plant = new Date(data.plantingDate);
      const harvest = new Date(data.estimatedHarvestDate);
      return harvest > plant;
    },
    {
      message: "Tanggal panen harus setelah tanggal tanam",
      path: ["estimatedHarvestDate"],
    }
  );

export const CashFlowItemFormSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["income", "production_expense"]),
  category: z.string().min(1, "Kategori harus diisi"),
  amountRupiah: safeRupiahSchema,
  timingDate: dateStringSchema,
  description: z.string().max(300, "Deskripsi maksimal 300 karakter").optional(),
  isHarvestIncome: z.boolean().optional(),
});

export const FinancingOptionInputSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1, "Nama pembiayaan harus diisi").max(100, "Nama maksimal 100 karakter"),
    principalRupiah: safeRupiahSchema,
    interestRateBps: z.number().int().min(0).max(100000, "Bunga basis points maksimal 100,000 (1000%)"),
    interestPeriod: z.enum(["MONTHLY", "ANNUAL"]),
    administrationFeeRupiah: safeRupiahSchema,
    otherUpfrontFeesRupiah: safeRupiahSchema,
    financingStartDate: dateStringSchema,
    gracePeriodMonths: z.number().int().nonnegative().default(0), // MVP: 0
    numberOfInstallments: z.number().int().positive("Jumlah cicilan harus positif"),
    repaymentFrequency: z.enum(["MONTHLY", "ONCE"]),
    repaymentStructure: z.enum(["FLAT_MONTHLY", "BULLET"]),
    firstRepaymentDate: dateStringSchema,
  })
  .refine(
    (data) => {
      const start = new Date(data.financingStartDate);
      const firstRepay = new Date(data.firstRepaymentDate);
      return firstRepay >= start;
    },
    {
      message: "Tanggal pembayaran pertama tidak boleh sebelum tanggal mulai pembiayaan",
      path: ["firstRepaymentDate"],
    }
  )
  .refine(
    (data) => {
      // BULLET must have repaymentFrequency = ONCE and numberOfInstallments = 1
      if (data.repaymentStructure === "BULLET") {
        return data.repaymentFrequency === "ONCE" && data.numberOfInstallments === 1;
      }
      // FLAT_MONTHLY must have repaymentFrequency = MONTHLY and numberOfInstallments >= 1
      if (data.repaymentStructure === "FLAT_MONTHLY") {
        return data.repaymentFrequency === "MONTHLY" && data.numberOfInstallments >= 1;
      }
      return true;
    },
    {
      message: "Struktur pembiayaan tidak cocok dengan frekuensi atau jumlah cicilan",
      path: ["repaymentStructure"],
    }
  )
  .refine(
    (data) => {
      // MVP flat monthly strategy grace period must be 0
      if (data.repaymentStructure === "FLAT_MONTHLY") {
        return data.gracePeriodMonths === 0;
      }
      return true;
    },
    {
      message: "Grace period belum didukung untuk skema FLAT_MONTHLY",
      path: ["gracePeriodMonths"],
    }
  );

export const PlanFormValuesSchema = z
  .object({
    schemaVersion: z.literal(1),
    title: z.string().min(1, "Judul rencana harus diisi").max(100, "Judul maksimal 100 karakter"),
    region: RegionSelectionSchema,
    cropPlan: CropPlanInputSchema,
    cashFlowItems: z.array(CashFlowItemFormSchema),
    monthlyHouseholdExpenseRupiah: safeRupiahSchema,
    openingBalanceRupiah: safeRupiahSchema,
    emergencyReserveRupiah: safeRupiahSchema,
    financingOptions: z.array(FinancingOptionInputSchema).max(2, "Maksimum 2 opsi pembiayaan untuk MVP"),
    notes: z.string().max(2000, "Catatan maksimal 2000 karakter").optional(),
  })
  .refine(
    (data) => {
      // Must contain at least one harvest income item
      return data.cashFlowItems.some((item) => item.isHarvestIncome === true && item.type === "income");
    },
    {
      message: "Harus ada minimal satu pendapatan panen",
      path: ["cashFlowItems"],
    }
  )
  .refine(
    (data) => {
      // Exactly 1 or 2 options for MVP
      return data.financingOptions.length >= 1 && data.financingOptions.length <= 2;
    },
    {
      message: "Harus diisi tepat satu atau dua opsi pembiayaan",
      path: ["financingOptions"],
    }
  );

export const CashFlowItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["income", "production_expense"]),
  category: z.string().min(1),
  amountRupiah: safeRupiahSchema,
  timingDate: dateStringSchema,
  description: z.string().max(300).optional(),
  isHarvestIncome: z.boolean().optional(),
});

export const CalculationInputSchema = z.object({
  schemaVersion: z.literal(1),
  engineVersion: z.literal("1.0.0"),
  planStartDate: dateStringSchema,
  planEndDate: dateStringSchema,
  openingBalanceRupiah: safeRupiahSchema,
  emergencyReserveRupiah: safeRupiahSchema,
  monthlyHouseholdExpenseRupiah: safeRupiahSchema,
  cashFlowItems: z.array(CashFlowItemSchema),
  financingOption: FinancingOptionInputSchema,
});

export const ChatContextSchema = z.object({
  page: z.string(),
  cropPlanSummary: z.any().optional(),
  financingSummary: z.any().optional(),
  expectedResult: z.any().optional(),
  scenarioResults: z.array(z.any()).optional(),
  comparisonResult: z.any().optional(),
  externalDataSummary: z.any().optional(),
  allowedKnowledgeSections: z.array(z.string()),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "Pesan tidak boleh kosong").max(1200, "Pesan maksimal 1200 karakter"),
  context: ChatContextSchema,
  locale: z.literal("id-ID"),
});

export const ChatResponseSchema = z.object({
  answer: z.string().min(1).max(1800),
  referencedSections: z.array(
    z.enum([
      "cash_gap",
      "repayment_timing",
      "scenario",
      "comparison",
      "external_data",
      "assumptions",
      "disclaimer",
    ])
  ).max(6),
  disclaimerRequired: z.boolean(),
});

// Backward compatibility aliases for Frontend
export const cashFlowItemSchema = CashFlowItemFormSchema;
export const cropPlanSchema = CropPlanInputSchema;
export const financingOptionSchema = FinancingOptionInputSchema;
export const planFormSchema = PlanFormValuesSchema;
