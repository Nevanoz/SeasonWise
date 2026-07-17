import type { FastifyPluginAsync } from "fastify";
import { authenticate } from "../plugins/auth.js";
import { PlanRepository } from "../repositories/plan-repository.js";
import { successEnvelope } from "../schemas/common.js";
import { CreatePlanBodySchema, DeletePlanBodySchema, DuplicatePlanBodySchema, ListPlansQuerySchema, PlanIdParamsSchema, ReplacePlanBodySchema } from "../schemas/plans.js";

const routes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authenticate);
  const repository = (request: Parameters<typeof authenticate>[0]) => new PlanRepository(request.server.createUserSupabase(request.accessToken!));
  app.get("/plans", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => {
    const query = ListPlansQuerySchema.parse(request.query);
    return successEnvelope(await repository(request).list(query.limit, query.cursor), request.id);
  });
  app.post("/plans", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = CreatePlanBodySchema.parse(request.body);
    return reply.status(201).send(successEnvelope(await repository(request).create(body.plan, body.source), request.id));
  });
  app.get("/plans/:id", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => {
    const { id } = PlanIdParamsSchema.parse(request.params);
    return successEnvelope(await repository(request).get(id), request.id);
  });
  app.put("/plans/:id", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request) => {
    const { id } = PlanIdParamsSchema.parse(request.params); const body = ReplacePlanBodySchema.parse(request.body);
    return successEnvelope(await repository(request).replace(id, body.expectedUpdatedAt, body.plan), request.id);
  });
  app.post("/plans/:id/duplicate", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const { id } = PlanIdParamsSchema.parse(request.params); const { title } = DuplicatePlanBodySchema.parse(request.body);
    return reply.status(201).send(successEnvelope(await repository(request).duplicate(id, title), request.id));
  });
  app.delete("/plans/:id", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request) => {
    const { id } = PlanIdParamsSchema.parse(request.params); DeletePlanBodySchema.parse(request.body);
    return successEnvelope(await repository(request).softDelete(id), request.id);
  });
};
export default routes;
