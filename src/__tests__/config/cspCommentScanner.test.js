import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  stripHtmlComments,
  findInlineScriptContents,
  hashInlineScript,
} from "../../../scripts/compute-csp-hashes.mjs";

// scripts/compute-csp-hashes.mjs prints the `sha256-<hash>` source that
// vercel.json's script-src must carry for each inline <script> in the built
// index.html. A maintainer runs it after `npm run build` and pastes the output.
//
// So a bug in how it reads the HTML does not fail loudly -- it prints a
// confidently WRONG hash, the wrong hash lands in vercel.json, and the real
// inline script is then refused by CSP in production. That surfaces only as a
// browser console error, which is the same class of silent break that
// csp.test.js (this directory) exists to prevent.
//
// The scanner previously used html.replace(/<!--[\s\S]*?-->/g, ""), which
// CodeQL flags as js/incomplete-multi-character-sanitization.
//
// Scope of the real defect, checked against the old implementation rather than
// assumed: the lazy [\s\S]*? DOES handle adjacent and nested comment markers
// correctly, because "-->" legitimately closes a comment in HTML. Those cases
// are pinned below as regression guards, not as bug demonstrations.
//
// What it does not handle is an UNTERMINATED "<!--": the regex matches nothing,
// returns the input unchanged, and the rest of the file is never stripped. The
// last test in this block pins that consequence directly -- a commented-out
// script gets hashed as real, which is the failure this scanner exists to
// prevent.
//
// These tests pin the scanning contract, and the last block pins that hashes for
// ordinary valid HTML are unchanged from the regex implementation's output.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** The previous implementation, kept here only to prove behavioural parity. */
function legacyStrip(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

/** The inline-script matcher the script uses, mirrored for legacy comparisons. */
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
    // A terminated "<!-- ... -->" inside a larger run of text is a real comment
    // and is removed, leaving the text around it intact.
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
    const html = "<!-- docs mention <script>notReal()</script> but never close";
    expect(legacyStrip(html)).toBe(html); // old behaviour: silently unstripped
    expect([...legacyStrip(html).matchAll(SCRIPT_RE)].map((m) => m[1])).toEqual(["notReal()"]);
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
    const expected = createHash("sha256").update("x=1", "utf8").digest("base64");
    expect(hashInlineScript("x=1")).toBe(expected);
  });
});

describe("behavioural parity with the previous implementation", () => {
  // The fix must not change hashes for ordinary valid HTML, or every existing
  // sha256 in vercel.json would need recomputing for no reason.
  const VALID_DOCS = {
    "no comments": "<!doctype html><html><head></head><body><div id=root></div></body></html>",
    "single comment": "<html><!-- build note --><script>a()</script></html>",
    "multi-line comment": "<html>\n<!-- line one\n     line two -->\n<script>b()</script>\n</html>",
    "comment before and after": "<!--a--><script>c()</script><!--b-->",
    "script plus src script": "<script>d()</script><script src='/e.js'></script>",
    "comment naming a script tag": "<!-- see <script>x()</script> --><script>f()</script>",
    empty: "",
    "text only": "just some text",
  };

  for (const [name, html] of Object.entries(VALID_DOCS)) {
    it(`produces identical comment stripping for: ${name}`, () => {
      expect(stripHtmlComments(html)).toBe(legacyStrip(html));
    });

    it(`produces identical script contents and hashes for: ${name}`, () => {
      const legacyMatches = [
        ...legacyStrip(html).matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g),
      ].map((m) => m[1]);
      const legacyHashes = legacyMatches.map((c) =>
        createHash("sha256").update(c, "utf8").digest("base64"),
      );

      expect(findInlineScriptContents(html)).toEqual(legacyMatches);
      expect(findInlineScriptContents(html).map(hashInlineScript)).toEqual(legacyHashes);
    });
  }

  it("the real index.html strips identically to the old implementation", () => {
    // The strongest parity check available without a build: whatever the source
    // template contains today must not change the scanner's output.
    const html = readFileSync(join(repoRoot, "index.html"), "utf8");
    expect(stripHtmlComments(html)).toBe(legacyStrip(html));
  });
});
