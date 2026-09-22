// scripts/check-build-env.mjs
//
// Build-time guard: refuse to build if a required VITE_* variable is missing.
//
// Why this exists: import.meta.env.VITE_* values are inlined by Vite at build
// time, not read at runtime. If VITE_CLOUDINARY_CLOUD_NAME is absent when
// `vite build` runs, every image URL silently compiles to
// res.cloudinary.com/undefined/..., the deployed page renders blank, and
// nothing in the build fails — which is exactly how the live site shipped
// broken. Exiting non-zero here fails the build loudly instead.
//
// Source of the value, by environment:
//   - Local:     .env (loaded via dotenv)
//   - Vercel:    project environment variables (Settings -> Environment Variables)
//   - GitHub CI: env: block in .github/workflows/ci.yml

import "dotenv/config";

const REQUIRED = ["VITE_CLOUDINARY_CLOUD_NAME"];

const missing = REQUIRED.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(
    [
      "",
      "  Build aborted: missing required environment variable(s):",
      ...missing.map((name) => `    - ${name}`),
      "",
      "  VITE_* variables are inlined at build time; building without them",
      "  ships a broken bundle (every Cloudinary image 404s -> blank page).",
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
