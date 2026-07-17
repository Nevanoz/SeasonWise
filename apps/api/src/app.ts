import fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform, type ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "./env";
import { healthRoutes } from "./routes/health";
import { calculateRoutes } from "./routes/calculate";
import { scenariosRoutes } from "./routes/scenarios";
import { compareRoutes } from "./routes/compare";

export async function buildApp() {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === "test" ? "silent" : "info",
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  // Add Zod compiler for validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Global plugins
  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Swagger setup
  await app.register(swagger, {
    openapi: {
      info: { title: "MusimAman API", version: "1.0.0" },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        error: "Bad Request",
        message: "Validation failed",
        details: error.validation,
      });
    }
    if (error.statusCode === 429) {
      return reply.status(429).send({ error: "Too Many Requests", message: "Rate limit exceeded" });
    }
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      message: env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  });

  // Register routes
  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(calculateRoutes);
  await app.register(scenariosRoutes);
  await app.register(compareRoutes);

  return app;
}
