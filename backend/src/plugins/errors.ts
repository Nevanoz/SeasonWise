import fp from "fastify-plugin";
import { ZodError } from "zod";
import { AppError } from "../schemas/common.js";

export default fp(async (app) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({ error: { code: "VALIDATION_ERROR", message: "Request validation failed", requestId: request.id, details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) } });
    }
    if (error.name === "EngineValidationError") {
      return reply.status(422).send({ error: { code: (error as any).code || "ENGINE_VALIDATION_ERROR", message: error.message, requestId: request.id } });
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message, requestId: request.id, ...(error.details ? { details: error.details } : {}) } });
    }
    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.status(429).send({ error: { code: "RATE_LIMITED", message: "Too many requests", requestId: request.id } });
    }
    if (error instanceof SyntaxError || (error as { code?: string }).code === "FST_ERR_CTP_INVALID_JSON_BODY") {
      return reply.status(400).send({ error: { code: "MALFORMED_JSON", message: "Malformed JSON request", requestId: request.id } });
    }
    const unknownError = error as Error;
    request.log.error({ err: { name: unknownError.name, message: unknownError.message } }, "request failed");
    return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Internal server error", requestId: request.id } });
  });
});
