import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { calculatePlan, SCENARIO_DEFAULTS, assessRisk } from "@musimaman/financial-engine";
import { CalculationInputSchema } from "@musimaman/validation";

export async function calculateRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/calculate",
    {
      schema: {
        description: "Calculate standard financial plan",
        tags: ["Calculation"],
        body: CalculationInputSchema,
      },
    },
    async (request, reply) => {
      const input = request.body;
      const expectedResult = calculatePlan(input, SCENARIO_DEFAULTS.EXPECTED);
      
      const mildResult = calculatePlan(input, SCENARIO_DEFAULTS.MILD);
      const severeResult = calculatePlan(input, SCENARIO_DEFAULTS.SEVERE);
      
      const risk = assessRisk(
        expectedResult,
        severeResult,
        input
      );

      // NOTE: Database snapshot logic will be integrated here later for ?saveSnapshot=true
      return reply.send({ ...expectedResult, risk });
    }
  );
}
