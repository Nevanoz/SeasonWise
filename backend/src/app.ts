import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { AppEnv } from "./env.js";
import { env as defaultEnv } from "./env.js";
import supabasePlugin from "./plugins/supabase.js";
import securityPlugin from "./plugins/security.js";
import errorsPlugin from "./plugins/errors.js";
import healthRoutes from "./routes/health.js";
import authSessionRoutes from "./routes/auth-session.js";
import planRoutes from "./routes/plans.js";
import marketPriceRoutes from "./routes/market-prices.js";
import chatRoutes from "./routes/chat.js";

export async function buildApp(appEnv: AppEnv = defaultEnv) {
  const app = Fastify({
    trustProxy: appEnv.TRUST_PROXY,
    bodyLimit: 100 * 1024,
    logger: appEnv.LOG_LEVEL === "silent" ? false : { level: appEnv.LOG_LEVEL, redact: ["req.headers.authorization", "req.headers.cookie", "headers.authorization", "headers.cookie"] }
  });
  app.decorate("env", appEnv);
  app.addHook("onRequest", async (request) => { request.authUser = null; request.accessToken = null; request.log.info({ requestId: request.id, method: request.method, route: request.routeOptions.url }, "request started"); });
  app.addHook("onResponse", async (request, reply) => { request.log.info({ requestId: request.id, method: request.method, route: request.routeOptions.url, status: reply.statusCode, latencyMs: reply.elapsedTime }, "request completed"); });
  await app.register(swagger, { openapi: { info: { title: "MusimAman Backend", version: "1.0.0" }, servers: [{ url: "/api/v1" }] } });
  await app.register(swaggerUi, { routePrefix: "/documentation" });
  await app.register(supabasePlugin);
  await app.register(securityPlugin);
  await app.register(errorsPlugin);
  await app.register(async (api) => { await api.register(healthRoutes); await api.register(authSessionRoutes); await api.register(planRoutes); await api.register(marketPriceRoutes); await api.register(chatRoutes); }, { prefix: "/api/v1" });
  return app;
}
