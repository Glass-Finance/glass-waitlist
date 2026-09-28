// Regression guard for the landing page's INTENTIONAL section animation:
// ProblemSection wipes its photo in with a scroll-triggered clip-path
// curtain. That reveal is page design, not image-loading behavior — it
// must survive image-pipeline changes (the LQIP removal changed only how
// the photo inside it loads: one optimized <img>, no placeholder).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Clock, Eye } from "lucide-react";

// BlurText reads window.matchMedia at MODULE scope (jsdom doesn't implement
// it), so the stub must run before ProblemSection's import chain evaluates.
// vi.hoisted runs ahead of the hoisted imports below.
vi.hoisted(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    });
  }
});

const ProblemSection = (await import("../../../components/common/ProblemSection")).default;

// IntersectionObserver isn't implemented in jsdom. Capture the instances so
// the test can fire them by hand and observe the full wipe lifecycle.
let observers;
class FakeIntersectionObserver {
  constructor(cb) {
    this.cb = cb;
    this.targets = [];
    observers.push(this);
  }
  observe(el) {
    this.targets.push(el);
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const props = {
  image: { publicId: "glass/problem/problem", width: 1280 },
  imageAlt: "Weekend reconciliation",
  problems: [
    { Icon: Clock, title: "Time lost", desc: "Manual reconciliation eats hours." },
    { Icon: Eye, title: "No visibility", desc: "Spreadsheets hide the truth." },
  ],
  headline: "Still spending weekends chasing payments?",
  subtext: "Without centralized visibility, trust begins to weaken.",
  clipInsetStart: "90%",
  staggerStep: 0.12,
};

describe("ProblemSection intentional animations", () => {
  it("keeps the clip-path curtain reveal on the image", () => {
    render(<ProblemSection {...props} />);

    // The photo renders through CloudImage as a single optimized <img> —
    // no placeholder layer beside it.
    const photo = screen.getByAltText("Weekend reconciliation");
    const clipWrapper = photo.parentElement.parentElement;
    expect(clipWrapper.querySelectorAll("img")).toHaveLength(1);

    // Mounted state: the wrapper is masked to the bottom strip, with the
    // 0.85s curtain transition armed.
    expect(clipWrapper.style.clipPath).toBe("inset(90% 0% 0% 0%)");
    expect(clipWrapper.style.transition).toContain("clip-path 0.85s");

    // Scroll-in fires the wipe: inset(90%) → inset(0%).
    const wipe = observers.find((o) => o.targets.includes(clipWrapper));
    expect(wipe).toBeTruthy();
    act(() => {
      wipe.cb([{ isIntersecting: true, target: clipWrapper }]);
    });
    expect(clipWrapper.style.clipPath).toBe("inset(0% 0% 0% 0%)");
  });

  it("still sets the slide-in start state on the problem items", () => {
    render(<ProblemSection {...props} />);
    const slideTargets = observers
      .flatMap((o) => o.targets)
      .filter((el) => el.style.transform === "translateX(-56px)");
    expect(slideTargets).toHaveLength(props.problems.length);
  });
});
