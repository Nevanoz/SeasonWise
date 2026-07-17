import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@musimaman/shared-types": path.resolve(__dirname, "../shared-types/src/index.ts"),
      "@musimaman/config": path.resolve(__dirname, "../config/src/index.ts"),
    },
  },
  test: {
    globals: false,
    environment: "node",
  },
});
