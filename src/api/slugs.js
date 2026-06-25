import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// SLUG API — generic slug generation/verification for communities & payment links
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/slugs/verify?type=&slug=
export const verifySlug = (type, slug) =>
  client.get("/slugs/verify", { params: { type, slug } });

// GET /api/v1/slugs/options?type=&name=
export const getSlugOptions = (type, name) =>
  client.get("/slugs/options", { params: { type, name } });
