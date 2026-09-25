import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import KycStepper from "../../../components/kyc/KycStepper";

afterEach(cleanup);

const LABELS = ["Overview", "ID type", "Capture", "Status"];

function pillFor(label) {
  return screen.getByText(label).closest("div");
}

describe("KycStepper", () => {
  it("renders all four steps with their labels", () => {
    render(<KycStepper current="overview" />);
    LABELS.forEach((label) => expect(screen.getByText(label)).toBeTruthy());
    expect(screen.getByRole("list", { name: "Verification steps" })).toBeTruthy();
  });

  it("marks the current step active with aria-current and a brand outline", () => {
    render(<KycStepper current="capture" />);
    const active = screen.getByText("Capture").closest("li");
    expect(active.getAttribute("aria-current")).toBe("step");
    expect(pillFor("Capture").className).toContain("ring-brand");
    expect(pillFor("Capture").className).toContain("bg-white");
  });

  it("fills prior steps (done) and mutes upcoming steps", () => {
    render(<KycStepper current="capture" />);
    // done — brand-tint pill, brand-filled icon circle, no aria-current
    expect(pillFor("Overview").className).toContain("bg-brand-tint");
    expect(pillFor("ID type").className).toContain("bg-brand-tint");
    expect(screen.getByText("Overview").closest("li").getAttribute("aria-current")).toBeNull();
    // upcoming — muted stacked-container pill
    expect(pillFor("Status").className).toContain("bg-stacked-container");
  });

  it("treats an unknown step id as the first step", () => {
    render(<KycStepper current="nope" />);
    expect(screen.getByText("Overview").closest("li").getAttribute("aria-current")).toBe("step");
  });
});
