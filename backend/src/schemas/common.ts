import { z } from "zod";

export const UuidSchema = z.string().uuid();
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const IsoTimestampSchema = z.string().datetime({ offset: true });
export const RupiahSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const BasisPointsSchema = z.number().int().min(0).max(100000);

export function successEnvelope<T>(data: T, requestId: string) {
  return { data, meta: { requestId, timestamp: new Date().toISOString() } };
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ path: string; message: string }>
  ) { super(message); }
}
