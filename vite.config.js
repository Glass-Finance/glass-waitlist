import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // e2e/ is Playwright (npm run test:e2e), not Vitest — without this the
    // default *.spec.js glob swallows those files and fails on the
    // @playwright/test import.
    exclude: [...configDefaults.exclude, "e2e/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      // Union of both branches: the summaries plus text detail, the local
      // html drill-down, and lcov for badges/future CI coverage reporting.
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/__tests__/**",
        "src/main.jsx",
        "src/App.jsx",
        "src/preview-notif*.jsx",
        "src/pages/dev/**",
      ],
      // Floors measured against the suite as of the initial coverage gate
      // (overall ~20% lines — a jsdom SPA with page-heavy surface). They are
      // regression gates, not aspirations: raise them when adding tests,
      // never lower them to make CI green.
      thresholds: {
        lines: 19,
        functions: 14,
        statements: 19,
        branches: 16,
        "src/utils/**": {
          lines: 48,
          functions: 43,
          statements: 49,
          branches: 53,
        },
        "src/api/**": {
          lines: 50,
          functions: 27,
          statements: 50,
          branches: 50,
        },
      },
    },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id))
            return "react-vendor";
          if (
            id.includes("node_modules/@tanstack/react-query") ||
            id.includes("node_modules\\@tanstack\\react-query")
          )
            return "query-vendor";
        },
      },
    },
  },
  server: {
    port: 3000,
    // proxy: {
    //   // Forwards /api requests server-side to the real backend. The
    //   // browser itself never sees a cross-origin request (so its CORS
    //   // preflight never fires) — but the backend was found to ALSO run
    //   // its own server-side Origin check independent of standard CORS,
    //   // rejecting anything not matching its allowlist. We rewrite the
    //   // Origin header here to one of the backend's allowed values so
    //   // that check passes too.
    //   "/api": {
    //     target: "https://api.glasspay.app",
    //     changeOrigin: true,
    //     secure: true,
    //     headers: {
    //       Origin: "https://api.glasspay.app",
    //     },
    //   },
    // },
  },
});
