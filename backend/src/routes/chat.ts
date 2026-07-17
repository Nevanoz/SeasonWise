import type { FastifyPluginAsync } from "fastify";
import { optionalAuthenticate } from "../plugins/auth.js";
import { ChatRequestSchema } from "../schemas/chat.js";
import { successEnvelope } from "../schemas/common.js";
import { ChatService } from "../ai/chat-service.js";

const routes: FastifyPluginAsync = async (app) => {
  const service = new ChatService(app.env);
  app.post("/chat", { bodyLimit: 20 * 1024, preHandler: optionalAuthenticate, config: { rateLimit: { max: app.env.CHAT_RATE_LIMIT_PER_MINUTE, timeWindow: "1 minute" } } }, async (request) => successEnvelope(await service.answer(ChatRequestSchema.parse(request.body)), request.id));
};
export default routes;
