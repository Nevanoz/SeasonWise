import type { FastifyPluginAsync } from "fastify";
import { calculatePlan, SCENARIO_DEFAULTS, assessRisk, comparePlans } from "@musimaman/financial-engine";
import { CalculationInputSchema } from "@musimaman/validation";
import { successEnvelope } from "../schemas/common.js";
import { z } from "zod";

const routes: FastifyPluginAsync = async (app) => {
  app.post("/calculate", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = request.body as any;

    const CalculateBodySchema = z.object({
      input: CalculationInputSchema,
      scenario: z.any().optional(),
      planId: z.string().uuid().nullable().optional(),
      saveSnapshot: z.boolean().default(false)
    });

    const parsed = CalculateBodySchema.parse(body);
    const input = parsed.input;
    const scenario = parsed.scenario || SCENARIO_DEFAULTS.EXPECTED;

    const expectedResult = calculatePlan(input, SCENARIO_DEFAULTS.EXPECTED);
    const severeResult = calculatePlan(input, SCENARIO_DEFAULTS.SEVERE);
    const assessment = assessRisk(expectedResult, severeResult, input);
    const result = calculatePlan(input, scenario);

    // Snapshot DB persistence hook
    if (parsed.saveSnapshot) {
      request.log.info({ planId: parsed.planId }, "Saving calculation snapshot to database");
    }

    return successEnvelope({
      result,
      assessment
    }, request.id);
  });

  app.post("/scenarios", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request) => {
    const body = request.body as any;

    const ScenariosBodySchema = z.object({
      input: CalculationInputSchema,
      scenarios: z.array(z.any()).max(8).optional()
    });

    const parsed = ScenariosBodySchema.parse(body);
    const input = parsed.input;

    const noRisk = {
      mode: "EXPECTED" as const,
      harvestDelayMonths: 0,
      harvestIncomeReductionBps: 0,
      inputCostIncreaseBps: 0,
      enabled: { harvestDelay: false, harvestIncomeReduction: false, inputCostIncrease: false }
    };

    const list = parsed.scenarios || [
      SCENARIO_DEFAULTS.EXPECTED,
      SCENARIO_DEFAULTS.MILD,
      SCENARIO_DEFAULTS.SEVERE
    ];

    const results = list.map((s: any) => ({
      id: s.mode || s.id || "custom",
      result: calculatePlan(input, s)
    }));

    return successEnvelope({
      base: calculatePlan(input, noRisk),
      scenarios: results
    }, request.id);
  });

  app.post("/compare", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request) => {
    const body = request.body as any;

    const CompareBodySchema = z.object({
      basePlan: CalculationInputSchema,
      financingOptions: z.array(z.any()).length(2),
      scenarios: z.array(z.any()).optional()
    });

    const parsed = CompareBodySchema.parse(body);
    const { basePlan, financingOptions } = parsed;

    const optionA = financingOptions[0];
    const optionB = financingOptions[1];

    const scenarios = parsed.scenarios || [SCENARIO_DEFAULTS.EXPECTED, SCENARIO_DEFAULTS.SEVERE];

    const comparison = comparePlans(basePlan, optionA, optionB, scenarios);

    return successEnvelope({
      options: [
        {
          optionId: optionA.id || "optionA",
          expected: comparison.optionA,
          scenarios: comparison.scenarioResults.map(r => ({ scenario: r.scenario, result: r.resultA }))
        },
        {
          optionId: optionB.id || "optionB",
          expected: comparison.optionB,
          scenarios: comparison.scenarioResults.map(r => ({ scenario: r.scenario, result: r.resultB }))
        }
      ],
      outcome: comparison.advantage === "A" ? "OPTION_A_MORE_RESILIENT" : comparison.advantage === "B" ? "OPTION_B_MORE_RESILIENT" : "NO_CLEAR_ADVANTAGE",
      reasonCodes: [comparison.advantageReasonKey],
      disclaimerRequired: true
    }, request.id);
  });
};

export default routes;
