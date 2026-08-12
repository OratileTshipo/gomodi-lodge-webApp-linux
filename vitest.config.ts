import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest's default include glob is **/*.{test,spec}.*, which also matches
    // the Playwright specs in e2e/ (they call @playwright/test's `test()`,
    // incompatible with Vitest's runner — "Playwright Test did not expect
    // test() to be called here"). Keep unit tests and browser tests separate:
    // Vitest runs lib/__tests__/*.test.ts; Playwright runs e2e/*.spec.ts.
    exclude: ["e2e/**", "node_modules/**", "dist/**", "cypress/**"],
  },
});
