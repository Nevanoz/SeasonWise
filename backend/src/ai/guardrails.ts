import { AppError } from "../schemas/common.js";
import type { ChatRequest } from "../schemas/chat.js";

const injectionPatterns = [/ignore (all|previous|prior) instructions?/i, /system prompt/i, /api[ _-]?key/i, /reveal (secret|prompt)/i, /abaikan (semua )?(instruksi|aturan)/i, /tampilkan (rahasia|prompt)/i];
const unrelatedPatterns = [/\b(write|buatkan) (code|kode|program)\b/i, /\b(recipe|resep|politik|football|sepak bola)\b/i];
export const fixedRefusal = "Maaf, saya hanya dapat menjelaskan MusimAman, rencana aktif, dan hasil yang sedang ditampilkan.";

export function sanitizeMessage(message: string, maxChars: number): string {
  return message.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxChars);
}
export function shouldRefuse(message: string): boolean { return injectionPatterns.some((pattern) => pattern.test(message)) || unrelatedPatterns.some((pattern) => pattern.test(message)); }
export function assertContextSize(request: ChatRequest): void {
  if (Buffer.byteLength(JSON.stringify(request.context), "utf8") > 12 * 1024) throw new AppError(422, "CHAT_CONTEXT_TOO_LARGE", "Chat context exceeds 12 KB");
}
export function allowedNumbers(context: unknown): Set<string> {
  const values = new Set<string>();
  const visit = (value: unknown) => { if (typeof value === "number" && Number.isFinite(value)) values.add(String(value)); else if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === "object") Object.values(value).forEach(visit); };
  visit(context); return values;
}
export function hasUnsupportedNumber(answer: string, allowed: Set<string>): boolean {
  const tokens = answer.match(/-?\d[\d.]*(?:,\d+)?/g) ?? [];
  return tokens.some((token) => { const normalized = token.replace(/\./g, "").replace(",", "."); return !allowed.has(normalized); });
}
