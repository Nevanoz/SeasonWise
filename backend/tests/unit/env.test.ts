import { describe, expect, it } from "vitest";
import { loadEnv } from "../../src/env.js";

describe("environment validation", () => {
  it("fails closed when production Supabase settings are absent", () => expect(() => loadEnv({ NODE_ENV:"production", LOG_HASH_SALT:"strong-test-salt" })).toThrow());
  it("allows Groq to be absent because templates are first-class", () => expect(loadEnv({ NODE_ENV:"test", GROQ_API_KEY:"" }).GROQ_API_KEY).toBe(""));
});