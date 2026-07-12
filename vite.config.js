import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return "react-vendor";
          if (id.includes("node_modules/@tanstack/react-query") || id.includes("node_modules\\@tanstack\\react-query")) return "query-vendor";
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