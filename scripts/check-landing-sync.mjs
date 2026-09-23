#!/usr/bin/env node
// scripts/check-landing-sync.mjs
//
// The marketing site (../glass-waitlist-v1) and this app deliberately keep
// separate copies of the shared landing/legal components — documented in
// README as a hand-porting rule that has already drifted once. This script
// makes that drift visible: any file that exists in BOTH repos under a
// shared path must be byte-identical.
//
// Local/dev use:  npm run check:landing-sync
// CI: the sibling repo isn't checked out in this repository's workflow, so
// the script exits 0 with a SKIP notice unless the sibling is present at
// ../glass-waitlist-v1 (clone it next to this repo to run locally, or add a
// second checkout step to CI later).
//
// Exit codes: 0 = in sync (or sibling absent), 1 = drift found.

import { readFileSync, existsSync, statSync, readdirSync } from "fs";
import { join, dirname, relative, sep } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const siblingRoot = join(appRoot, "..", "glass-waitlist-v1");

// Shared subtrees that are intentionally duplicated across the two repos.
const SHARED_ROOTS = [
  join("src", "components", "organizations"),
  join("src", "components", "members"),
  join("src", "components", "howItWorks"),
  join("src", "components", "legal"),
  join("src", "components", "ui"),
  join("src", "components", "common"),
  join("src", "pages", "legal"),
  join("src", "lib"),
  join("src", "utils"),
  "vercel.json",
  "eslint.config.js",
  ".prettierrc",
];

function walk(root, dir, out = []) {
  if (!existsSync(root)) return out;
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

if (!existsSync(siblingRoot)) {
  console.log(
    `SKIP: sibling repo not found at ${siblingRoot} — clone glass-waitlist-v1 ` +
      `next to this repo (or add a CI checkout) to run the landing-sync check.`,
  );
  process.exit(0);
}

const drift = [];
let compared = 0;

for (const shared of SHARED_ROOTS) {
  const appPath = join(appRoot, shared);
  const mkPath = join(siblingRoot, shared);

  const appIsFile = existsSync(appPath) && statSync(appPath).isFile();
  const mkIsFile = existsSync(mkPath) && statSync(mkPath).isFile();

  if (appIsFile && mkIsFile) {
    compared += 1;
    if (sha256(appPath) !== sha256(mkPath)) drift.push(shared);
    continue;
  }

  if (existsSync(appPath) && statSync(appPath).isDirectory()) {
    for (const file of walk(appRoot, appPath)) {
      const rel = relative(appRoot, file);
      const other = join(siblingRoot, rel);
      if (!existsSync(other) || !statSync(other).isFile()) continue; // repo-specific file
      compared += 1;
      if (sha256(file) !== sha256(other)) drift.push(rel.split(sep).join("/"));
    }
  }
}

if (drift.length > 0) {
  console.error("FAIL: landing components drifted between the two repos:\n");
  for (const f of drift) console.error(`  - ${f}`);
  console.error(
    "\nPort the newer copy to the other repo (see README 'two-repo' rule), " +
      "or delete the copy that no longer belongs there.",
  );
  process.exit(1);
}

console.log(`OK: ${compared} shared file(s) identical across both repos.`);
