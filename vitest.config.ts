import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Keep vitest to the unit tests. Without this, vitest's default include
    // pattern also picks up e2e/*.spec.ts (Playwright specs) and fails with
    // "Playwright Test did not expect test() to be called here."
    exclude: [
      "e2e/**",
      "node_modules/**",
      "dist/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
});
