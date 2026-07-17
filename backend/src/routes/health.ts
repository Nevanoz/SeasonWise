import type { FastifyPluginAsync } from "fastify";

const routes: FastifyPluginAsync = async (app) => {
  app.get("/health", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async () => {
    let supabase: "ok" | "unavailable" = "unavailable";
    if (app.supabaseAdmin) {
      try {
        const result = await Promise.race([
          app.supabaseAdmin.from("profiles").select("id", { head: true }).limit(1),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("health timeout")), 1500))
        ]);
        if (!result.error) supabase = "ok";
      } catch { supabase = "unavailable"; }
    }
    return {
      status: supabase === "ok" ? "ok" : "degraded",
      version: "1.0.0",
      engineVersion: app.env.ENGINE_VERSION,
      checks: { api: "ok", supabase, marketPrice: app.env.MARKET_PRICE_PROVIDER === "mock" ? "mock" : "unknown", groq: app.env.GROQ_API_KEY ? "unknown" : "template" },
      timestamp: new Date().toISOString()
    };
  });
};
export default routes;