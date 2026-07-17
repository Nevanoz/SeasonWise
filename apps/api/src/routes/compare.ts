import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { comparePlans } from "@musimaman/financial-engine";
import { CalculationInputSchema } from "@musimaman/validation";
import { z } from "zod";

export async function compareRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/compare",
    {
      schema: {
        description: "Compare two financing options",
        tags: ["Calculation"],
        body: z.object({
          inputA: CalculationInputSchema,
          inputB: CalculationInputSchema,
        }),
      },
    },
    async (request, reply) => {
      const { inputA, inputB } = request.body;
      const comparison = comparePlans(inputA, inputA.financingOption, inputB.financingOption);
      
      return reply.send({
        planA: comparison.optionA,
        planB: comparison.optionB,
        recommendation: comparison.advantage,
        advantageReasonKey: comparison.advantageReasonKey,
      });
    }
  );
}
