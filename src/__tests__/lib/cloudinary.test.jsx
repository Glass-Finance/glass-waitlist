import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { cldUrl, cldSrcSet, widthsFor } from "../../lib/cloudinary";
import CloudImage from "../../components/common/CloudImage";

const CLOUD = "ece5jmhy";

beforeEach(() => {
  vi.stubEnv("VITE_CLOUDINARY_CLOUD_NAME", CLOUD);
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

  it("applies blur as a small LQIP placeholder variant", () => {
    const url = cldUrl("glass/hero/hero", { blur: true });
    expect(url).toContain("w_64");
    expect(url).not.toContain("e_blur");
    expect(url).not.toContain("q_auto:low");
    expect(url).not.toContain("w_32");
  });

  it("ignores width/dpr for the placeholder variant", () => {
    const url = cldUrl("glass/hero/hero", { blur: true, width: 1920, dpr: 2 });
    expect(url).toContain("w_64");
    expect(url).not.toContain("w_1920");
    expect(url).not.toContain("dpr_2");
  });

  it("respects a custom crop and quality", () => {
    expect(cldUrl("glass/Glass", { crop: "fill", quality: 80 })).toContain(
      "f_auto,q_80,c_fill/glass/Glass",
    );
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders a real image with srcSet and a blurred placeholder", () => {
    const { container } = render(
      <CloudImage publicId="glass/usecase/icon-schools" alt="Schools" width={144} />,
    );
    const real = screen.getByAltText("Schools");
    expect(real.getAttribute("src")).toMatch(/w_144\/glass\/usecase\/icon-schools$/);
    expect(real.getAttribute("srcSet")).toContain("144w");
    expect(real.getAttribute("loading")).toBe("lazy");
    const placeholder = container.querySelector('img[aria-hidden="true"]');
    expect(placeholder).toBeTruthy();
    expect(placeholder.classList.contains("opacity-100")).toBe(true);
  });

  it("loads eagerly and marks fetchpriority=high for priority images", () => {
    render(<CloudImage publicId="glass/hero/hero" alt="Hero" width={1920} priority />);
    const real = screen.getByAltText("Hero");
    expect(real.getAttribute("loading")).toBe("eager");
    expect(real.getAttribute("fetchpriority")).toBe("high");
  });

  it("fades the placeholder out once the real image loads", () => {
    const { container } = render(<CloudImage publicId="glass/Glass" alt="Logo" width={120} />);
    const real = screen.getByAltText("Logo");
    const placeholder = container.querySelector('img[aria-hidden="true"]');
    expect(placeholder.classList.contains("opacity-100")).toBe(true);
    act(() => {
      real.dispatchEvent(new Event("load"));
    });
    expect(placeholder.classList.contains("opacity-0")).toBe(true);
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
});
