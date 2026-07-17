import type { FastifyPluginAsync } from "fastify";
import { authenticate } from "../plugins/auth.js";
import { successEnvelope } from "../schemas/common.js";

const routes: FastifyPluginAsync = async (app) => {
  app.get("/auth/session", { preHandler: authenticate, config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => successEnvelope({ userId: request.authUser!.id }, request.id));
};
export default routes;
