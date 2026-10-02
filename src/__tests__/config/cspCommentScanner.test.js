import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  stripHtmlComments,
  findInlineScriptContents,
  hashInlineScript,
} from "../../../scripts/compute-csp-hashes.mjs";

// scripts/compute-csp-hashes.mjs prints the `sha256-<hash>` source for every
// inline <script> in the built index.html. A maintainer runs it after `npm run
// build` and pastes the output into vercel.json's Content-Security-Policy.
//
// So a bug in how it reads the HTML does not fail loudly -- it prints a
// confidently WRONG hash, the wrong hash lands in vercel.json, and the real
// inline script is then refused by CSP in production. That surfaces only as a
// browser console error, which is the same class of silent break that
// csp.test.js (this directory) exists to prevent.
//
// The scanner previously stripped comments with a single regex, which CodeQL
// flagged as js/incomplete-multi-character-sanitization.
//
// Scope of the real defect, checked against the old implementation rather than
// assumed: the lazy [\s\S]*? DOES handle adjacent and nested comment markers
// correctly, because "-->" legitimately closes a comment in HTML. Those cases
// are pinned below as regression guards, not as bug demonstrations.
//
// What it does not handle is an UNTERMINATED "<!--": the regex matches nothing,
// returns the input unchanged, and the rest of the file is never stripped. The
// test in the findInlineScriptContents block pins that consequence directly --
// a commented-out script gets hashed as real, which is the failure this scanner
// exists to prevent.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/**
 * The `sha256-...` sources vercel.json's script-src actually serves.
 *
 * This is the oracle for "the scanner did not change what we deploy", and it is
 * deliberately an EXTERNAL one -- the values production requires. Nothing here
 * recomputes them from the code under test, so these assertions cannot drift
 * along with a regression the way a copy of the previous implementation would.
 *
 * The source template, the built output, and the deployed policy all agree on
 * this same pair, which is what lets one oracle cover all three.
 */
const DEPLOYED_SCRIPT_HASHES = [
  "Zg1J4txFCl1ri1RegJTouTyZFdOsurrWLmo0CuHQiqs=",
  "fniemBdEF5QacBItAgar1z5OLs6DXO2BnnC/LXIlhHk=",
];

/**
 * The inline-script matcher, used only as an independent cross-check on the
 * scanner's extraction. It is not a sanitizer and is not used to strip
 * anything, so it is not a sanitization site.
 */
const SCRIPT_RE = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;

describe("stripHtmlComments", () => {
  it("removes an ordinary comment and keeps surrounding content", () => {
    expect(stripHtmlComments("<a><!-- note --><b>keep</b></a>")).toBe("<a><b>keep</b></a>");
  });

  it("removes a comment spanning multiple lines", () => {
    const html = "<head>\n  <!-- a\n  multi-line\n  note -->\n  <title>t</title>\n</head>";
    expect(stripHtmlComments(html)).toBe("<head>\n  \n  <title>t</title>\n</head>");
  });

  it("handles adjacent comments with no separator", () => {
    // Regression guard, not a former bug: the old lazy regex also got this right.
    // The scanner must keep matching each comment separately.
    expect(stripHtmlComments("<!--a--><!--b-->tail")).toBe("tail");
  });

  it("handles several adjacent comments in a row", () => {
    expect(stripHtmlComments("<!--1--><!--2--><!--3-->x")).toBe("x");
  });

  it("handles comment-like text nested inside a comment", () => {
    // A nested "<!--" is not a new comment in HTML: the comment ends at the
    // first "-->". Also a regression guard -- the old regex agreed here.
    const html = "<!-- outer <!-- inner --> after-close";
    expect(stripHtmlComments(html)).toBe(" after-close");
  });

  it("keeps a lone closing delimiter that appears in ordinary text", () => {
    // "-->" with no matching "<!--" is just text and must survive untouched --
    // it is not the start of anything.
    expect(stripHtmlComments("a --> b")).toBe("a --> b");
  });

  it("keeps comment-like text inside ordinary content when it is properly closed", () => {
    // A terminated comment inside a larger run of text is a real comment and is
    // removed, leaving the text around it intact.
    expect(stripHtmlComments("before <!-- x --> after")).toBe("before  after");
  });

  it("leaves a document with no comments byte-for-byte identical", () => {
    const html = "<!doctype html><html><body>hi</body></html>";
    expect(stripHtmlComments(html)).toBe(html);
  });

  it("handles an empty string", () => {
    expect(stripHtmlComments("")).toBe("");
  });

  it("handles a comment at the very start and the very end", () => {
    expect(stripHtmlComments("<!--head-->mid<!--tail-->")).toBe("mid");
  });

  it("throws on an unterminated comment instead of partially stripping", () => {
    // The load-bearing case. A partial strip would return plausible-looking
    // HTML and produce a wrong hash; failing loudly forces a look at the file.
    expect(() => stripHtmlComments("<div><!-- never closed")).toThrow(/Unterminated HTML comment/);
  });

  it("names the offset of the unterminated comment", () => {
    expect(() => stripHtmlComments("abcd<!-- x")).toThrow(/offset 4/);
  });

  it("throws when a later comment is unterminated even if an earlier one closed", () => {
    expect(() => stripHtmlComments("<!--ok--><p>x</p><!--dangling")).toThrow(
      /Unterminated HTML comment/,
    );
  });
});

describe("findInlineScriptContents", () => {
  it("returns the content of an inline script", () => {
    expect(findInlineScriptContents("<script>console.log(1)</script>")).toEqual(["console.log(1)"]);
  });

  it("ignores scripts that have a src attribute", () => {
    const html = '<script src="/assets/main.js"></script><script>inline()</script>';
    expect(findInlineScriptContents(html)).toEqual(["inline()"]);
  });

  it("does not treat a <script> mentioned inside a comment as executable", () => {
    // The original reason the comment stripper existed: prose in index.html
    // mentioning "<script>" must not be hashed as if it were a real tag.
    const html = "<!-- example: <script>notReal()</script> --><script>real()</script>";
    expect(findInlineScriptContents(html)).toEqual(["real()"]);
  });

  it("does not treat a commented-out script with a src as a src script", () => {
    const html = '<!-- <script src="/a.js"></script> --><script src="/b.js"></script>';
    expect(findInlineScriptContents(html)).toEqual([]);
  });

  it("returns several inline scripts in document order", () => {
    const html = "<script>first()</script><script src='/x.js'></script><script>second()</script>";
    expect(findInlineScriptContents(html)).toEqual(["first()", "second()"]);
  });

  it("leaves script content outside comments untouched, including markup-like text", () => {
    const content = 'const a = "<div>"; if (a < b) {}';
    expect(findInlineScriptContents(`<script>${content}</script>`)).toEqual([content]);
  });

  it("refuses to hash commented-out script content when a comment never closes", () => {
    // The concrete harm the old implementation caused, asserted directly.
    //
    // The stripper exists so a comment mentioning "<script>" in prose is not
    // hashed as real. With an unterminated comment the old regex matched nothing
    // and returned the input unchanged, so this commented-out code came back as
    // if it were a live inline script. A maintainer would paste THAT hash into
    // vercel.json, and the genuinely-inlined script would go unhashed and be
    // refused by CSP in production. Failing loudly is the only safe answer.
    //
    // The old behaviour is asserted as a literal expectation rather than by
    // re-running the old sanitizer. Quoting a second copy of that vulnerable
    // strip here would reintroduce js/incomplete-multi-character-sanitization on
    // a line that sanitises nothing, and would make this test depend on the very
    // code under scrutiny instead of on a stated fact.
    const html = "<!-- docs mention <script>notReal()</script> but never close";

    // Old behaviour as expected values: nothing was stripped, so the
    // commented-out script is indistinguishable from live inline content. This is
    // exactly what would have been hashed and pasted into vercel.json.
    expect(html.includes("<!--")).toBe(true); // nothing removed it
    expect([...html.matchAll(SCRIPT_RE)].map((m) => m[1])).toEqual(["notReal()"]);

    // Current behaviour: the same malformed input is rejected outright rather
    // than mis-hashed. Both entry points must refuse it -- the stripper throws,
    // and the caller that would have produced the hash propagates that failure.
    expect(() => stripHtmlComments(html)).toThrow(/Unterminated HTML comment/);
    expect(() => findInlineScriptContents(html)).toThrow(/Unterminated HTML comment/);
  });

  it("propagates the unterminated-comment failure rather than returning a partial list", () => {
    expect(() => findInlineScriptContents("<script>ok()</script><!--dangling")).toThrow(
      /Unterminated HTML comment/,
    );
  });

  it("returns an empty array when there are no inline scripts", () => {
    expect(findInlineScriptContents("<html><body>hi</body></html>")).toEqual([]);
  });
});

describe("hashInlineScript", () => {
  it("is a base64 sha256 of the exact content, with no added whitespace", () => {
    // Recomputed here with node:crypto, i.e. independently of the module's own
    // helper, so this pins the encoding rather than restating it.
    const expected = createHash("sha256").update("x=1", "utf8").digest("base64");
    expect(hashInlineScript("x=1")).toBe(expected);
  });
});

describe("the hashes this scanner feeds into the deployed CSP", () => {
  // The scanner must not change what we deploy. If it did, every existing
  // sha256 in vercel.json would need recomputing -- and if nobody recomputed
  // them, the real inline script would be refused by CSP in production.
  //
  // The oracle is the deployed policy itself, not a copy of the previous
  // implementation. That distinction is the point: an oracle copied from the
  // code under test drifts together with a regression, whereas these values are
  // what production actually requires.
  //
  // If these literals ever need updating, the correct action is the documented
  // one: `npm run build`, then `node scripts/compute-csp-hashes.mjs`, then paste
  // the output into vercel.json's Content-Security-Policy. Editing them without
  // updating the deployed policy would paper over a real outage.

  it("reproduces the deployed hashes from the built index.html", () => {
    const builtHtml = join(repoRoot, "dist", "index.html");
    if (!existsSync(builtHtml)) {
      // `npm run test` runs before `npm run build` in CI, so there is no build
      // output to assert against there. The source-template test below is the
      // one that always runs; this one adds the built-output check whenever a
      // build is present, which is the case that maps to what is deployed.
      return;
    }
    const contents = findInlineScriptContents(readFileSync(builtHtml, "utf8"));
    expect(contents.map(hashInlineScript)).toEqual(DEPLOYED_SCRIPT_HASHES);
  });

  it("vercel.json still carries exactly the hashes the scanner produces", () => {
    // Closes the loop: the literals above only mean something while they match
    // the policy actually served.
    const vercel = JSON.parse(readFileSync(join(repoRoot, "vercel.json"), "utf8"));
    const csp = vercel.headers
      .flatMap((route) => route.headers ?? [])
      .find((h) => h.key === "Content-Security-Policy").value;
    const deployed = [...csp.matchAll(/'sha256-([^']+)'/g)].map((m) => m[1]);
    expect(deployed).toEqual(DEPLOYED_SCRIPT_HASHES);
  });

  it("produces the deployed hashes from the source index.html template", () => {
    // The build-independent check, and the one that always runs -- CI runs
    // `npm run test` before `npm run build`, so this is the assertion that
    // actually executes there. It pins the scanner against the template in the
    // repository, so an edit that silently changes what would be hashed is caught
    // before a deploy rather than after.
    const html = readFileSync(join(repoRoot, "index.html"), "utf8");
    const contents = findInlineScriptContents(html);
    expect(contents.length).toBeGreaterThan(0);
    expect(contents.map(hashInlineScript)).toEqual(DEPLOYED_SCRIPT_HASHES);
  });

  it("extracts exactly the inline scripts an independent matcher finds", () => {
    // Guards the hash assertions above: if the template gained or lost an inline
    // script, that shows up here plainly instead of looking like a scanner bug.
    const html = readFileSync(join(repoRoot, "index.html"), "utf8");
    const viaScanner = findInlineScriptContents(html);
    const viaIndependentMatcher = [...html.matchAll(SCRIPT_RE)].map((m) => m[1]);
    expect(viaScanner).toEqual(viaIndependentMatcher);
    expect(viaScanner.length).toBeGreaterThan(0);
  });
});

describe("scanner behaviour on representative documents", () => {
  // Properties that must hold for each shape, stated directly rather than
  // derived from a second copy of the implementation.
  const CASES = [
    { name: "no comments", html: "<!doctype html><html><head></head><body>hi</body></html>" },
    { name: "single comment", html: "<html><!-- build note --><b>x</b></html>" },
    {
      name: "multi-line comment",
      html: "<html>\n<!-- line one\n     line two -->\n<b>x</b>\n</html>",
    },
    { name: "comment before and after", html: "<!--a--><i>c</i><!--b-->" },
    { name: "comment naming a script tag", html: "<!-- see <script>x()</script> --><i>f</i>" },
    { name: "adjacent comments", html: "<!--a--><!--b--><i>x</i>" },
    { name: "empty", html: "" },
    { name: "text only", html: "just some text" },
  ];

  for (const { name, html } of CASES) {
    it(`removes every comment while keeping live content: ${name}`, () => {
      const stripped = stripHtmlComments(html);
      expect(stripped.includes("<!--")).toBe(false);
      expect(stripped.includes("-->")).toBe(false);
      // Idempotent: rescanning a stripped document changes nothing, which is
      // what makes the resulting hash stable across repeated runs.
      expect(stripHtmlComments(stripped)).toBe(stripped);
    });
  }

  it("keeps inline script contents byte-identical, and ignores src scripts", () => {
    const html =
      "<!-- docs --><script>const a = 1; const b = 2;</script><script src='/x.js'></script>";
    expect(findInlineScriptContents(html)).toEqual(["const a = 1; const b = 2;"]);
  });

  it("produces the same hash for the same script content found twice", () => {
    // Hashes must depend only on content, so two identical scripts cannot
    // produce different CSP sources and leave the policy with a dead hash.
    const html = "<script>same()</script><script>same()</script>";
    const hashes = findInlineScriptContents(html).map(hashInlineScript);
    expect(hashes).toHaveLength(2);
    expect(hashes[0]).toBe(hashes[1]);
  });
});
