import { z } from "zod";

export const ProviderStatusSchema = z.enum(["live", "cached", "mock", "unavailable"]);
export const MarketPriceQuerySchema = z.object({
  commodity: z.enum(["rice", "corn", "chili", "coffee", "palm_oil"]),
  provinceCode: z.string().min(1).max(20),
  unit: z.string().min(1).max(40).default("IDR_PER_KG")
}).strict();

export const MarketPriceContextSchema = z.object({
  commodity: z.string(),
  region: z.string(),
  unit: z.string(),
  priceRupiah: z.number().int().nonnegative().nullable(),
  rangeRupiah: z.object({ low: z.number().int().nonnegative(), high: z.number().int().nonnegative() }).strict().nullable(),
  source: z.string(),
  dataDate: z.string().nullable(),
  lastCheckedAt: z.string().datetime(),
  status: ProviderStatusSchema,
  stale: z.boolean(),
  synthetic: z.boolean(),
  canAutofill: z.boolean()
}).strict();
export type MarketPriceContext = z.infer<typeof MarketPriceContextSchema>;
export type MarketPriceQuery = z.infer<typeof MarketPriceQuerySchema>;
