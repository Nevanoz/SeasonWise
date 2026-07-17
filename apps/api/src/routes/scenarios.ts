import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { calculatePlan, SCENARIO_DEFAULTS, type ScenarioConfig } from "@musimaman/financial-engine";
import { CalculationInputSchema } from "@musimaman/validation";
import { z } from "zod";

export async function scenariosRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/scenarios",
    {
      schema: {
        description: "Run multiple risk scenarios on a financial plan",
        tags: ["Calculation"],
        body: CalculationInputSchema,
      },
    },
    async (request, reply) => {
      const input = request.body;
      
      const noRisk: ScenarioConfig = { ...SCENARIO_DEFAULTS.CUSTOM, enabled: { harvestDelay: false, harvestIncomeReduction: false, inputCostIncrease: false } };
      
      return reply.send({
        base: calculatePlan(input, noRisk),
        mild: calculatePlan(input, SCENARIO_DEFAULTS.MILD),
        severe: calculatePlan(input, SCENARIO_DEFAULTS.SEVERE),
      });
    }
  );
}
