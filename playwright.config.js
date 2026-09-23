import { defineConfig } from "@playwright/test";

// ESLint lints every *.js in the repo with browser globals only (see
// eslint.config.js), so this Node-side config deliberately never references
// `process` — including for CI detection. CI runs the suite with `npm run
// test:e2e` after `npx playwright install --with-deps chromium` (see
// .github/workflows/ci.yml); with no server up, webServer starts `npm run
// dev`, and reuseExistingServer lets a locally running dev server be reused
// instead of spawning a second one on port 3000.
export default defineConfig({
  testDir: "./e2e",
  // Deliberately narrow: Vitest's default include never matches *.e2e.js, and
  // nothing else in e2e/ is a spec — the two suites cannot pick up each
  // other's files.
  testMatch: "**/*.e2e.js",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: "test-results",
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
