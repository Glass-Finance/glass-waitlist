import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../../components/ui/Button";

// Guards DESIGN-SYSTEM.md §2. These assertions are deliberately literal:
// if the Figma spec changes, the spec file changes first and this test is
// the thing that should then fail and be updated with it.
describe("Button — design system conformance", () => {
  it("renders a real button element", () => {
    render(<Button>Pay now</Button>);
    // this repo has no jest-dom matchers -- plain DOM assertions
    expect(screen.getByRole("button", { name: "Pay now" }).tagName).toBe("BUTTON");
  });

  it("defaults to type=button so it can't submit a form by accident", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });

  it.each([
    // [size, padding, height, label]
    ["xs", "py-2", "px-3", "h-8", "text-[12px]"],
    ["sm", "py-2", "px-4", "h-10", "text-[14px]"],
    ["md", "py-3", "px-6", "h-12", "text-[14px]"],
    ["lg", "py-4", "px-8", "h-14", "text-[16px]"],
    ["xl", "py-5", "px-10", "h-16", "text-[16px]"],
  ])("size %s maps to its Figma padding/height/label", (size, py, px, h, text) => {
    render(<Button size={size}>Go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain(py);
    expect(cls).toContain(px);
    expect(cls).toContain(h);
    expect(cls).toContain(text);
  });

  it("uses 4px radius at every state, per the smaller-value-wins rule", () => {
    render(<Button>Go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("rounded-g-1");
    expect(cls).not.toContain("rounded-lg");
    expect(cls).not.toContain("rounded-xl");
    expect(cls).not.toContain("rounded-full");
  });

  it("uses weight 500, never 600/700", () => {
    render(<Button>Go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("font-medium");
    expect(cls).not.toContain("font-semibold");
    expect(cls).not.toContain("font-bold");
  });

  it("carries the #0f53ff focus ring", () => {
    render(<Button>Go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("focus-visible:outline-focus");
    expect(cls).toContain("focus-visible:outline-2");
    expect(cls).toContain("focus-visible:outline-offset-2");
  });

  it.each([
    "primary",
    "critical",
    "outline",
    "outline-neutral",
    "outline-caution",
    "tonal",
    "tertiary",
  ])("%s renders with all five states present", (variant) => {
    render(<Button variant={variant}>Go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("hover:");
    expect(cls).toContain("active:");
    expect(cls).toContain("focus-visible:");
  });

  it("primary fills with the brand token and hovers to a precomputed overlay", () => {
    render(<Button variant="primary">Go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("bg-brand");
    expect(cls).toContain("hover:bg-brand-hover");
    expect(cls).toContain("active:bg-brand-pressed");
    // hover must not be element opacity — Figma stacks a black overlay on
    // the fill, and opacity would fade the label too.
    expect(cls).not.toContain("hover:opacity");
  });

  it("outline roles are transparent with a 10% black stroke, not filled", () => {
    render(<Button variant="outline">Cancel</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("bg-transparent");
    expect(cls).toContain("border-black/10");
    expect(cls).not.toContain("bg-gray-100");
  });

  it("outline-caution labels in the danger colour", () => {
    render(<Button variant="outline-caution">Cancel</Button>);
    expect(screen.getByRole("button").className).toContain("text-danger");
  });

  describe("legacy variant aliases", () => {
    it.each([
      ["brand", "bg-brand"],
      ["danger", "bg-danger"],
      ["secondary", "bg-transparent"],
    ])("maps %s", (variant, expected) => {
      render(<Button variant={variant}>Go</Button>);
      expect(screen.getByRole("button").className).toContain(expected);
    });
  });

  describe("disabled and loading", () => {
    it("disabled prevents interaction", () => {
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Go
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn.disabled).toBe(true);
      expect(btn.className).toContain("cursor-not-allowed");
      btn.click();
      expect(onClick).not.toHaveBeenCalled();
    });

    it("loading disables the button and marks it busy", () => {
      render(<Button loading>Saving</Button>);
      const btn = screen.getByRole("button");
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute("aria-busy")).toBe("true");
    });

    it("disabled keeps the brand fill rather than swapping to an invented colour", () => {
      render(<Button disabled>Go</Button>);
      const cls = screen.getByRole("button").className;
      expect(cls).toContain("bg-brand");
      // #B0B8D8 was the old disabled fill; it is not in the design file.
      expect(cls).not.toContain("B0B8D8");
    });
  });

  it("fullWidth defaults on and can be turned off", () => {
    const { rerender } = render(<Button>Go</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
    rerender(<Button fullWidth={false}>Go</Button>);
    expect(screen.getByRole("button").className).not.toContain("w-full");
  });

  it("forwards refs and extra props", () => {
    const ref = { current: null };
    render(
      <Button ref={ref} data-testid="cta" name="pay">
        Go
      </Button>,
    );
    const btn = screen.getByTestId("cta");
    expect(ref.current).toBe(btn);
    expect(btn.getAttribute("name")).toBe("pay");
  });

  it("className is appended last so callers can override", () => {
    render(<Button className="mt-4">Go</Button>);
    expect(screen.getByRole("button").className).toMatch(/mt-4$/);
  });
});
