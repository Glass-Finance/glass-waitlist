// scripts/check-build-env.mjs
//
// Build-time guard: refuse to build if a required VITE_* variable is missing.
//
// Why this exists: import.meta.env.VITE_* values are inlined by Vite at build
// time, not read at runtime. If a required variable is absent when `vite build`
// runs, the deployed bundle ships broken — VITE_CLOUDINARY_CLOUD_NAME compiles
// every image URL to res.cloudinary.com/undefined/... (blank page),
// VITE_API_BASE_URL points the app at the wrong backend — and nothing in the
// build fails. Exiting non-zero here fails the build loudly instead.
//
// Source of the value, by environment:
//   - Local:     .env (loaded via dotenv)
//   - Vercel:    project environment variables (Settings -> Environment Variables)
//   - GitHub CI: env: block in .github/workflows/ci.yml

import "dotenv/config";

const REQUIRED = ["VITE_CLOUDINARY_CLOUD_NAME", "VITE_API_BASE_URL"];

const missing = REQUIRED.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(
    [
      "",
      "  Build aborted: missing required environment variable(s):",
      ...missing.map((name) => `    - ${name}`),
      "",
      "  VITE_* variables are inlined at build time; building without them",
      "  ships a broken bundle (Cloudinary images 404 -> blank page, wrong",
      "  API base, etc).",
      "",
      "  Fix:",
      "    local  -> add it to .env (see .env.example)",
      "    Vercel -> Project Settings -> Environment Variables, then redeploy",
      "    CI     -> env: block in .github/workflows/ci.yml",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(
  `  env check passed: ${REQUIRED.map((name) => `${name}=${process.env[name]}`).join(", ")}`,
);
