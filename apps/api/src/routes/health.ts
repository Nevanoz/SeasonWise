import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";

export async function healthRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/",
    {
      schema: {
        description: "Health check endpoint",
        tags: ["System"],
        response: {
          200: z.object({
            status: z.enum(["ok", "degraded", "down"]),
            version: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      // Since financial engine is pure, we are mostly healthy if the server is up.
      return reply.send({
        status: "ok",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    }
  );
}
