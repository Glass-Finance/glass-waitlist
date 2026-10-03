#!/usr/bin/env node
// scripts/check-landing-sync.mjs
//
// Landing ownership (decided): `glass-waitlist-v1` owns glasspay.app and is the
// source of truth for all landing content. This repo keeps a DEPRECATED landing
// copy for historical reference only.
//
// Because this repo previously documented itself as the landing source of truth,
// the realistic failure mode is an agent or contributor "fixing" a landing
// component here and believing it shipped. It does not ship. This script makes
// that impossible to do silently:
//
//   GUARD (default, exit 1 on failure)
//     - Every file in DEPRECATED_LANDING_FILES must hash-match
//       scripts/landing-deprecation.lock.json.
//     - Editing one fails, naming glass-waitlist-v1 as the correct target.
//     - Deleting one also fails: removal is a deliberate, separately-reviewed
//       step, not a side effect of a copy edit.
//   REPORT (never fails)
//     - Prints what marketing has that this repo does not, and which shared
//       files differ, so the known legacy delta stays visible.
//
// The sibling repo is required in CI and optional locally. When it is absent:
//   - CI=true      -> exit 1 (a silent skip is how 26 drifted files shipped)
//   - CI unset/false -> exit 0 with a SKIP notice, preserving local DX
//
// Run with --update-lock to re-baseline the guard. Only ever do that as a
// deliberate, reviewed change -- never to make a landing edit pass.

import { readFileSync, existsSync, statSync, readdirSync, writeFileSync } from "fs";
import { join, dirname, relative, sep } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const siblingRoot = join(appRoot, "..", "glass-waitlist-v1");
const lockPath = join(here, "landing-deprecation.lock.json");

const MARKETING = "glass-waitlist-v1 (https://github.com/Glass-Finance/glass-waitlist-v1)";

/**
 * Landing files this repo no longer owns. `src/pages/legal/` and
 * `src/components/legal/` are deliberately ABSENT: they are routed in App.jsx
 * and linked from sign-up, KYC, and emails, so they must keep resolving on the
 * app host. Shared infrastructure with app-side importers (CloudImage,
 * Button, TextInput, LoadingState, EmptyState, BrandedSpinner, lib/cloudinary,
 * utils/deviceRedirect) is likewise excluded -- verified by reference analysis.
 */
const DEPRECATED_LANDING_FILES = [
  "src/pages/OrganizationsHome.jsx",
  "src/pages/MembersHome.jsx",
  "src/components/Navbar.jsx",
  "src/components/Footer.jsx",
  "src/components/UseCases.jsx",
  "src/components/TrustedBy.jsx",
  "src/components/WhyGlass.jsx",
  "src/components/SecurityFeatures.jsx",
  "src/components/ui/BlurText.jsx",
  "src/components/ui/VariableProximity.jsx",
  "src/components/ui/VariableProximity.css",
  "src/components/common/CTASection.jsx",
  "src/components/common/ProblemSection.jsx",
  "src/components/common/SolutionSection.jsx",
  "src/hooks/useScrollReveal.js",
  "src/hooks/useSeoMeta.js",
];

/** Directories owned entirely by marketing; drift here is reported, never fatal. */
const MARKETING_OWNED_DIRS = [
  join("src", "components", "organizations"),
  join("src", "components", "members"),
  join("src", "components", "howItWorks"),
];

function walk(root, dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walk(root, full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const isCI = process.env.CI === "true" || process.env.CI === "1";
const updateLock = process.argv.includes("--update-lock");

/** Build the {relPath: sha256} map that the guard compares against. */
function currentHashes() {
  const map = {};
  for (const rel of DEPRECATED_LANDING_FILES) {
    const full = join(appRoot, rel);
    if (existsSync(full) && statSync(full).isFile()) map[rel] = sha256(full);
  }
  return map;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

// ── --update-lock: re-baseline the guard ──────────────────────────────────────
if (updateLock) {
  const hashes = currentHashes();
  const missing = DEPRECATED_LANDING_FILES.filter((f) => !hashes[f]);
  if (missing.length) {
    console.error(
      "Cannot write the lock -- these deprecated landing files are missing:\n" +
        missing.map((f) => `  - ${f}`).join("\n"),
    );
    process.exit(1);
  }
  const payload = {
    $comment:
      "Checksums of the DEPRECATED landing copy in this repo. glass-waitlist-v1 owns " +
      "glasspay.app and is the source of truth for landing content. Do not edit these " +
      "files. Regenerate with `node scripts/check-landing-sync.mjs --update-lock` only " +
      "as a deliberate, reviewed change -- see docs/landing-ownership.md.",
    owner: MARKETING,
    files: hashes,
  };
  writeFileSync(lockPath, JSON.stringify(payload, null, 2) + "\n");
  console.log(
    `Wrote ${Object.keys(hashes).length} checksum(s) to scripts/landing-deprecation.lock.json`,
  );
  process.exit(0);
}

// ── Guard ─────────────────────────────────────────────────────────────────────
if (!existsSync(lockPath)) {
  fail(
    "FAIL: scripts/landing-deprecation.lock.json is missing.\n\n" +
      `  ${MARKETING} owns glasspay.app and all landing content. This repo's landing\n` +
      "  copy is deprecated and guarded by checksum. Without the lock the guard cannot\n" +
      "  run, and a silent skip is exactly how the previous drift shipped.\n\n" +
      "  Restore the lock from git, or re-baseline deliberately with:\n" +
      "    node scripts/check-landing-sync.mjs --update-lock",
  );
}

const expected = JSON.parse(readFileSync(lockPath, "utf8")).files ?? {};
const actual = currentHashes();
const problems = [];

for (const [rel, hash] of Object.entries(expected)) {
  if (!(rel in actual)) {
    problems.push(`  DELETED  ${rel}`);
  } else if (actual[rel] !== hash) {
    problems.push(`  MODIFIED ${rel}`);
  }
}
for (const rel of Object.keys(actual)) {
  if (!(rel in expected)) problems.push(`  UNEXPECTED (not in lock) ${rel}`);
}

if (problems.length) {
  fail(
    "FAIL: this repo's landing copy is DEPRECATED and must not be edited here.\n\n" +
      problems.join("\n") +
      "\n\n" +
      `  glasspay.app is built only from ${MARKETING}, which owns the public\n` +
      "  marketing site and is the source of truth for landing content. A change to\n" +
      "  the files listed above does not reach users.\n\n" +
      "  Make the change in glass-waitlist-v1 instead. See docs/landing-ownership.md\n" +
      "  for the recorded decision and current drift state.\n" +
      "  (If a change here was genuinely intended, re-baseline with --update-lock\n" +
      "  and say so explicitly in the PR -- do not do it to silence this check.)",
  );
}

// ── Report (informational only) ───────────────────────────────────────────────
const tracked = Object.keys(expected).length;
console.log(
  `OK: ${tracked} deprecated landing file(s) unchanged — landing ownership guard passed.`,
);
console.log(`    owner: ${MARKETING}`);

if (!existsSync(siblingRoot)) {
  const msg =
    "SKIP: sibling repo not found at " +
    siblingRoot +
    " — cannot report the drift delta.\n" +
    "      (The guard above still ran and passed. Clone glass-waitlist-v1 next to this\n" +
    "      repo to see the delta; CI always has it checked out.)";
  if (isCI) {
    fail(
      "FAIL (CI): " +
        msg.replace(/^SKIP: /, "") +
        "\n  In CI the sibling repo is required so drift stays visible.",
    );
  }
  console.log(msg);
  process.exit(0);
}

const mkFiles = new Set(
  MARKETING_OWNED_DIRS.flatMap((d) => walk(siblingRoot, join(siblingRoot, d))).map((f) =>
    relative(siblingRoot, f).split(sep).join("/"),
  ),
);
const appFiles = new Set(
  MARKETING_OWNED_DIRS.flatMap((d) => walk(appRoot, join(appRoot, d))).map((f) =>
    relative(appRoot, f).split(sep).join("/"),
  ),
);

const onlyInMarketing = [...mkFiles].filter((f) => !appFiles.has(f)).sort();
const differing = [...mkFiles]
  .filter((f) => appFiles.has(f))
  .filter((f) => !cmpEq(join(siblingRoot, f), join(appRoot, f)))
  .sort();

function cmpEq(a, b) {
  try {
    return readFileSync(a).equals(readFileSync(b));
  } catch {
    return false;
  }
}

console.log("");
console.log("Drift delta vs glass-waitlist-v1 (informational — does not fail):");
console.log(`  files marketing has that this repo does not: ${onlyInMarketing.length}`);
for (const f of onlyInMarketing) console.log(`    + ${f}`);
console.log(`  shared files that differ: ${differing.length}`);
for (const f of differing) console.log(`    ~ ${f}`);
console.log("");
console.log(
  "  These are the known legacy delta. glass-waitlist-v1 is correct; do not port this repo's version forward.",
);
