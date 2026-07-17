import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";
import { createHash } from "node:crypto";
import { AppError } from "../schemas/common.js";

function bearerSubject(header: string | undefined): string | null {
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown };
    return typeof parsed.sub === "string" ? parsed.sub : null;
  } catch { return null; }
}

export default fp(async (app) => {
  const allowed = new Set(app.env.CORS_ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean));
  await app.register(cors, { origin(origin, callback) { if (!origin || allowed.has(origin)) callback(null, true); else callback(new AppError(403, "CORS_ORIGIN_DENIED", "Origin not allowed"), false); } });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, {
    global: false,
    keyGenerator(request) {
      const identity = request.authUser?.id ?? bearerSubject(request.headers.authorization) ?? request.ip;
      return createHash("sha256").update(`${app.env.LOG_HASH_SALT}:${identity}`).digest("hex");
    }
  });
});
