import { z } from "zod";
import { BasisPointsSchema, IsoDateSchema, IsoTimestampSchema, RupiahSchema, UuidSchema } from "./common.js";

const RegionSchema = z.object({
  provinceCode: z.string().min(1).max(20),
  regencyCode: z.string().min(1).max(30),
  districtCode: z.string().min(1).max(40).nullable().default(null)
}).strict();

const CropPlanSchema = z.object({
  cropType: z.enum(["rice", "corn", "chili", "coffee", "palm_oil"]),
  templateVersion: z.string().min(1).max(50).default("v1"),
  plantingDate: IsoDateSchema,
  estimatedHarvestDate: IsoDateSchema,
  cycleDurationDays: z.number().int().positive().max(3650),
  productionPhases: z.array(z.string().min(1).max(100)).max(30).default([]),
  expectedHarvestQuantity: z.number().min(0).max(1_000_000_000),
  quantityUnit: z.string().min(1).max(30),
  expectedSellingPriceRupiah: RupiahSchema,
  expectedTotalHarvestIncomeRupiah: RupiahSchema.optional(),
  assumptions: z.array(z.string().min(1).max(200)).max(30).default([])
}).strict().refine((value) => value.estimatedHarvestDate > value.plantingDate, {
  path: ["estimatedHarvestDate"], message: "Harvest date must be after planting date"
});

const CashFlowItemSchema = z.object({
  id: UuidSchema.optional(),
  type: z.enum(["income", "production_expense"]),
  category: z.string().min(1).max(100),
  amountRupiah: RupiahSchema,
  timingDate: IsoDateSchema,
  description: z.string().max(300).optional(),
  isHarvestIncome: z.boolean().default(false)
}).strict();

const FinancingOptionSchema = z.object({
  id: UuidSchema.optional(),
  name: z.string().min(1).max(100),
  principalRupiah: RupiahSchema,
  interestRateBps: BasisPointsSchema,
  interestPeriod: z.enum(["MONTHLY", "ANNUAL"]),
  administrationFeeRupiah: RupiahSchema.default(0),
  otherUpfrontFeesRupiah: RupiahSchema.default(0),
  financingStartDate: IsoDateSchema,
  gracePeriodMonths: z.literal(0).default(0),
  numberOfInstallments: z.number().int().positive().max(120),
  repaymentFrequency: z.enum(["MONTHLY", "ONCE"]),
  repaymentStructure: z.enum(["FLAT_MONTHLY", "BULLET"]),
  firstRepaymentDate: IsoDateSchema
}).strict().superRefine((value, context) => {
  if (value.firstRepaymentDate < value.financingStartDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ["firstRepaymentDate"], message: "Repayment cannot precede financing" });
  if (value.repaymentStructure === "BULLET" && (value.repaymentFrequency !== "ONCE" || value.numberOfInstallments !== 1)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["repaymentStructure"], message: "Bullet financing must have one payment" });
  if (value.repaymentStructure === "FLAT_MONTHLY" && value.repaymentFrequency !== "MONTHLY") context.addIssue({ code: z.ZodIssueCode.custom, path: ["repaymentFrequency"], message: "Flat financing must be monthly" });
});

export const PlanInputSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().trim().min(1).max(100),
  region: RegionSchema,
  cropPlan: CropPlanSchema,
  cashFlowItems: z.array(CashFlowItemSchema).max(200),
  monthlyHouseholdExpenseRupiah: RupiahSchema,
  openingBalanceRupiah: RupiahSchema,
  emergencyReserveRupiah: RupiahSchema,
  financingOptions: z.array(FinancingOptionSchema).min(1).max(2),
  notes: z.string().max(2000).optional()
}).strict().refine((value) => value.cashFlowItems.some((item) => item.type === "income" && item.isHarvestIncome), {
  path: ["cashFlowItems"], message: "At least one harvest income item is required"
});

export const CreatePlanBodySchema = z.object({ plan: PlanInputSchema, source: z.enum(["new", "guest_migration"]).default("new") }).strict();
export const ReplacePlanBodySchema = z.object({ expectedUpdatedAt: IsoTimestampSchema, plan: PlanInputSchema }).strict();
export const DuplicatePlanBodySchema = z.object({ title: z.string().trim().min(1).max(100) }).strict();
export const DeletePlanBodySchema = z.object({ confirm: z.literal(true) }).strict();
export const PlanIdParamsSchema = z.object({ id: UuidSchema }).strict();
export const ListPlansQuerySchema = z.object({ cursor: z.string().max(500).optional(), limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();
export type PlanInput = z.infer<typeof PlanInputSchema>;
