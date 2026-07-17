import { z } from "zod";
import { ProviderStatusSchema } from "./market-price.js";

export const KnowledgeSectionSchema = z.enum(["cash_gap", "repayment_timing", "scenario", "comparison", "risk_assessment", "external_data", "assumptions", "disclaimer"]);
const ResultSummarySchema = z.object({
  minimumBalanceRupiah: z.number().int(),
  maximumCashGapRupiah: z.number().int().nonnegative(),
  firstCashGapMonth: z.string().nullable(),
  totalFinancingPaymentRupiah: z.number().int().nonnegative(),
  totalFinancingCostRupiah: z.number().int().nonnegative(),
  repaymentToIncomeRatioBps: z.number().int().nonnegative(),
  endingBalanceRupiah: z.number().int()
}).strict();

export const ChatContextSchema = z.object({
  page: z.enum(["results", "compare", "report"]),
  cropPlanSummary: z.object({ cropType: z.string().max(40), plantingDate: z.string(), estimatedHarvestDate: z.string(), region: z.string().max(120) }).strict().nullable(),
  financingSummary: z.object({ structure: z.enum(["FLAT_MONTHLY", "BULLET"]), repaymentTiming: z.string().max(120), totalPaymentRupiah: z.number().int().nonnegative() }).strict().nullable(),
  expectedResult: ResultSummarySchema.nullable(),
  scenarioResults: z.array(z.object({ id: z.string().max(60), label: z.string().max(100), result: ResultSummarySchema }).strict()).max(8),
  comparisonResult: z.object({ outcome: z.string().max(80), reasonCodes: z.array(z.string().max(80)).max(10) }).strict().nullable(),
  externalDataSummary: z.object({ source: z.string().max(120), status: ProviderStatusSchema, dataDate: z.string().nullable(), commodity: z.string().max(40), unit: z.string().max(40) }).strict().nullable(),
  allowedKnowledgeSections: z.array(KnowledgeSectionSchema).min(1).max(8)
}).strict();

export const ChatRequestSchema = z.object({ message: z.string().min(1), context: ChatContextSchema, locale: z.literal("id-ID") }).strict();
export const ChatModelResponseSchema = z.object({
  answer: z.string().min(1).max(1800),
  referencedSections: z.array(KnowledgeSectionSchema).max(6),
  disclaimerRequired: z.boolean()
}).strict();
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatModelResponse = z.infer<typeof ChatModelResponseSchema>;