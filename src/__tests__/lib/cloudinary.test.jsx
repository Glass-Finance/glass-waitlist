import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { render, screen } from "@testing-library/react";
import { cldUrl, cldSrcSet, widthsFor } from "../../lib/cloudinary";
import CloudImage from "../../components/common/CloudImage";
import CloudAspectImage from "../../components/common/CloudAspectImage";

const CLOUD = "ece5jmhy";

beforeEach(() => {
  vi.stubEnv("VITE_CLOUDINARY_CLOUD_NAME", CLOUD);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cldUrl", () => {
  it("returns a default f_auto/q_auto/c_limit URL with no opts", () => {
    expect(cldUrl("glass/hero/hero")).toBe(
      `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,c_limit/glass/hero/hero`,
    );
  });

  it("applies width and dpr", () => {
    expect(cldUrl("glass/hero/hero", { width: 1920, dpr: 2 })).toMatch(
      /\/f_auto,q_auto,c_limit,w_1920,dpr_2\/glass\/hero\/hero$/,
    );
  });

  it("respects a custom crop and quality", () => {
    expect(cldUrl("glass/Glass", { crop: "fill", quality: 80 })).toContain(
      "f_auto,q_80,c_fill/glass/Glass",
    );
  });

  it("generates only the optimized variant — no blur/placeholder transform exists", () => {
    const url = cldUrl("glass/hero/hero", { width: 1440 });
    expect(url).toBe(
      `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,c_limit,w_1440/glass/hero/hero`,
    );
    expect(url).not.toContain("blur");
    // The retired LQIP options (blur, blurWidth) are inert — the normal
    // optimized URL is the only URL the pipeline can produce.
    expect(cldUrl("glass/hero/hero", { blur: true, blurWidth: 320, width: 1440 })).toBe(url);
  });
});

describe("cldSrcSet", () => {
  it("builds a 'url widthw' list joined by commas", () => {
    const set = cldSrcSet("glass/hero/hero", [400, 800, 1200]);
    const entries = set.split(", ").map((e) => e.trim());
    expect(entries).toHaveLength(3);
    expect(entries[1]).toBe(
      `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,c_limit,w_800/glass/hero/hero 800w`,
    );
  });
});

describe("widthsFor", () => {
  it("always includes the exact target width", () => {
    expect(widthsFor(720)).toContain(720);
  });

  it("caps buckets at 2x the target for retina headroom", () => {
    const widths = widthsFor(200);
    expect(Math.max(...widths)).toBe(400);
  });

  it("returns sorted unique widths", () => {
    const widths = widthsFor(800);
    expect([...widths].sort((a, b) => a - b)).toEqual(widths);
    expect(new Set(widths).size).toBe(widths.length);
  });
});

describe("CloudImage", () => {
  it("renders exactly one optimized image — no placeholder request", () => {
    const { container } = render(
      <CloudImage publicId="glass/usecase/icon-schools" alt="Schools" width={144} />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelector('img[aria-hidden="true"]')).toBeNull();
    const real = screen.getByAltText("Schools");
    expect(real.getAttribute("src")).toBe(
      `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,c_limit,w_144/glass/usecase/icon-schools`,
    );
    expect(real.getAttribute("srcSet")).toContain("144w");
    expect(real.getAttribute("sizes")).toBe("100vw");
  });

  it("renders with no blur layer and no opacity crossfade", () => {
    const { container } = render(<CloudImage publicId="glass/hero/hero" alt="Hero" width={1200} />);
    const img = container.querySelector("img");
    // No inline blur filter...
    expect(img.style.filter).toBe("");
    // ...no opacity gating (visible from first render)...
    expect(img.className).not.toContain("opacity-0");
    expect(img.className).not.toContain("opacity-100");
    // ...and no transition machinery for a load animation.
    expect(img.className).not.toContain("transition-opacity");
  });

  it("defaults to browser-driven lazy loading with async decode", () => {
    render(<CloudImage publicId="glass/hero/hero" alt="Hero" width={1200} />);
    const real = screen.getByAltText("Hero");
    expect(real.getAttribute("loading")).toBe("lazy");
    expect(real.getAttribute("decoding")).toBe("async");
  });

  it("loads eagerly and marks fetchpriority=high for priority images", () => {
    render(<CloudImage publicId="glass/hero/hero" alt="Hero" width={1920} priority />);
    const real = screen.getByAltText("Hero");
    expect(real.getAttribute("loading")).toBe("eager");
    expect(real.getAttribute("fetchpriority")).toBe("high");
  });

  it("applies object-contain when requested", () => {
    render(
      <CloudImage
        publicId="glass/usecase/icon-clubs"
        alt="Clubs"
        width={144}
        objectFit="contain"
      />,
    );
    expect(screen.getByAltText("Clubs").className).toContain("object-contain");
  });

  it("forwards imgRef to the rendered <img>", () => {
    const ref = { current: null };
    render(<CloudImage publicId="glass/icon/step-1" alt="Ico" width={80} imgRef={ref} />);
    expect(ref.current).toBe(screen.getByAltText("Ico"));
  });
});

describe("CloudAspectImage", () => {
  it("reserves space via aspectRatio before the image loads", () => {
    const { container } = render(
      <CloudAspectImage
        publicId="glass/hero/iphone"
        alt="Phone"
        width={1240}
        aspectRatio="876 / 791"
      />,
    );
    expect(container.firstElementChild.style.aspectRatio).toBe("876 / 791");
  });

  it("renders without a reserved ratio when aspectRatio is omitted", () => {
    const { container } = render(
      <CloudAspectImage publicId="glass/hero/iphone" alt="Phone" width={1240} />,
    );
    expect(container.firstElementChild.style.aspectRatio).toBe("");
  });

  it("renders exactly one optimized image — no placeholder, blur, or crossfade", () => {
    const { container } = render(
      <CloudAspectImage
        publicId="glass/work/org-go-live"
        alt="Step"
        width={1440}
        aspectRatio="563 / 303"
      />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelector('img[aria-hidden="true"]')).toBeNull();
    const real = screen.getByAltText("Step");
    expect(real.getAttribute("src")).toBe(
      `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,c_limit,w_1440/glass/work/org-go-live`,
    );
    expect(real.getAttribute("srcSet")).toContain("1440w");
    expect(real.getAttribute("decoding")).toBe("async");
    expect(real.style.filter).toBe("");
    expect(real.className).not.toContain("opacity-0");
    expect(real.className).not.toContain("transition-opacity");
  });

  it("forwards the caller's loading strategy to the browser", () => {
    render(
      <CloudAspectImage publicId="glass/work/org-go-live" alt="Step" width={1440} loading="lazy" />,
    );
    expect(screen.getByAltText("Step").getAttribute("loading")).toBe("lazy");
  });
});

describe("preconnect", () => {
  it("index.html preconnects to res.cloudinary.com exactly once", () => {
    // cwd is the project root (vitest runs from the package dir).
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const hits = html.match(/<link rel="preconnect" href="https:\/\/res\.cloudinary\.com"\s*\/>/g);
    expect(hits).toHaveLength(1);
  });
});
