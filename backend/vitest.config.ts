import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 45000,
    hookTimeout: 45000,
    coverage: {
      reporter: ["text", "json-summary"]
    }
  }
});
