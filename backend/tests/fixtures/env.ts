import { loadEnv, type AppEnv } from "../../src/env.js";

export function testEnv(overrides: NodeJS.ProcessEnv = {}): AppEnv {
  return loadEnv({
    NODE_ENV: "test",
    API_HOST: "127.0.0.1",
    API_PORT: "4000",
    CORS_ALLOWED_ORIGINS: "http://localhost:3000",
    LOG_LEVEL: "silent",
    LOG_HASH_SALT: "test-hash-salt",
    TRUST_PROXY: "false",
    SUPABASE_URL: "",
    SUPABASE_PUBLISHABLE_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
    GROQ_API_KEY: "",
    GROQ_MODEL: "openai/gpt-oss-20b",
    GROQ_TIMEOUT_MS: "100",
    GROQ_MAX_OUTPUT_TOKENS: "450",
    CHAT_MAX_INPUT_CHARS: "1200",
    CHAT_RATE_LIMIT_PER_MINUTE: "5",
    CHAT_DEDUPE_WINDOW_SECONDS: "30",
    GROQ_CIRCUIT_BREAKER_SECONDS: "300",
    MARKET_PRICE_PROVIDER: "mock",
    MARKET_PRICE_BASE_URL: "",
    MARKET_PRICE_TIMEOUT_MS: "100",
    MARKET_PRICE_CACHE_TTL_SECONDS: "86400",
    EXTERNAL_MEMORY_CACHE_TTL_SECONDS: "300",
    ENGINE_VERSION: "1.0.0",
    RISK_CONFIG_VERSION: "prototype-1",
    DEMO_DATA_VERSION: "1",
    ...overrides
  });
}