import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import KycStepper from "../../../components/kyc/KycStepper";

// The stepper moved from four labelled pills to three segments plus a
// "Step X of Y" header, when the overview step became the Glass Pass rail.
// These assertions track the new contract: three segments, the active step's
// name stated once in the header, and aria-current still marking progress for
// assistive tech (the segments themselves carry no text).
afterEach(cleanup);

function segments() {
  return within(screen.getByRole("list", { name: "Verification steps" })).getAllByRole("listitem");
}

describe("KycStepper", () => {
  it("renders three progress segments", () => {
    render(<KycStepper current="id-type" />);
    expect(screen.getByRole("list", { name: "Verification steps" })).toBeTruthy();
    expect(segments()).toHaveLength(3);
  });

  it("states the step number and name in the header", () => {
    render(<KycStepper current="id-type" />);
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();
    expect(screen.getByText("Pick your ID")).toBeTruthy();
  });

  it("moves the header forward with the flow", () => {
    render(<KycStepper current="next-up" />);
    expect(screen.getByText("Step 2 of 3")).toBeTruthy();
    expect(screen.getByText("What happens next")).toBeTruthy();
  });

  it("marks only the current step with aria-current", () => {
    render(<KycStepper current="next-up" />);
    const items = segments();
    expect(items[1].getAttribute("aria-current")).toBe("step");
    expect(items[0].getAttribute("aria-current")).toBeNull();
    expect(items[2].getAttribute("aria-current")).toBeNull();
  });

  it("treats an unknown step id as the first step", () => {
    render(<KycStepper current="nope" />);
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();
    expect(segments()[0].getAttribute("aria-current")).toBe("step");
  });
});
