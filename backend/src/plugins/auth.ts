import type { FastifyRequest } from "fastify";
import { AppError } from "../schemas/common.js";

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function optionalAuthenticate(request: FastifyRequest): Promise<void> {
  request.authUser = null;
  request.accessToken = null;
  const token = bearerToken(request);
  if (!token) return;
  if (!request.server.supabaseAdmin) throw new AppError(503, "SUPABASE_UNAVAILABLE", "Authentication service is unavailable");
  const { data, error } = await request.server.supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new AppError(401, "UNAUTHENTICATED", "Invalid or expired access token");
  request.authUser = data.user;
  request.accessToken = token;
}

export async function authenticate(request: FastifyRequest): Promise<void> {
  await optionalAuthenticate(request);
  if (!request.authUser || !request.accessToken) throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
}
