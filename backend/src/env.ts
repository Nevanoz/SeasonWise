import { z } from "zod";

const booleanString = z.enum(["true", "false"]).default("false").transform((value) => value === "true");
const optionalUrl = z.union([z.string().url(), z.literal("")]).default("");

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().min(1).default("::"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  LOG_HASH_SALT: z.string().min(8).default("development-only-salt"),
  TRUST_PROXY: booleanString,
  SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: z.string().default(""),
  SUPABASE_SECRET_KEY: z.string().default(""),
  SUPABASE_SERVICE_KEY: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  GROQ_API_KEY: z.string().default(""),
  GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-20b"),
  GROQ_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  GROQ_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(64).max(4096).default(450),
  CHAT_MAX_INPUT_CHARS: z.coerce.number().int().min(100).max(5000).default(1200),
  CHAT_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(5),
  CHAT_DEDUPE_WINDOW_SECONDS: z.coerce.number().int().positive().default(30),
  GROQ_CIRCUIT_BREAKER_SECONDS: z.coerce.number().int().positive().default(300),
  MARKET_PRICE_PROVIDER: z.enum(["mock", "verified"]).default("mock"),
  MARKET_PRICE_BASE_URL: optionalUrl,
  MARKET_PRICE_TIMEOUT_MS: z.coerce.number().int().positive().default(3500),
  MARKET_PRICE_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  EXTERNAL_MEMORY_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  ENGINE_VERSION: z.string().min(1).default("1.0.0"),
  RISK_CONFIG_VERSION: z.string().min(1).default("prototype-1"),
  DEMO_DATA_VERSION: z.coerce.number().int().positive().default(1)
}).superRefine((value, context) => {
  if (value.NODE_ENV !== "production") return;
  for (const key of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "LOG_HASH_SALT"] as const) {
    if (!value[key]) context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required in production` });
  }
  if (!(value.SUPABASE_SECRET_KEY || value.SUPABASE_SERVICE_ROLE_KEY || value.SUPABASE_SERVICE_KEY)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["SUPABASE_SECRET_KEY"], message: "A Supabase server secret is required in production" });
  }
  if (value.MARKET_PRICE_PROVIDER === "verified" && !value.MARKET_PRICE_BASE_URL) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["MARKET_PRICE_BASE_URL"], message: "Required for verified market provider" });
  }
});

export type AppEnv = z.infer<typeof EnvSchema>;
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv { return EnvSchema.parse(source); }
export const env = loadEnv();
