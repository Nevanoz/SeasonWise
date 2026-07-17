import type { FastifyPluginAsync } from "fastify";
import { MarketPriceQuerySchema } from "../schemas/market-price.js";
import { successEnvelope } from "../schemas/common.js";
import { MarketPriceService } from "../services/market-price-service.js";

const routes: FastifyPluginAsync = async (app) => {
  const service = new MarketPriceService(app.supabaseAdmin, app.env.EXTERNAL_MEMORY_CACHE_TTL_SECONDS * 1000, app.env.MARKET_PRICE_CACHE_TTL_SECONDS);
  app.get("/market-prices", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (request) => successEnvelope(await service.get(MarketPriceQuerySchema.parse(request.query)), request.id));
};
export default routes;
