import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import StatusNarrative from "../../../components/kyc/StatusNarrative";
import { KYC_NARRATIVE_LINES } from "../../../components/kyc/narrativeLines";

afterEach(cleanup);

describe("StatusNarrative", () => {
  it("shows the opening line while the secure window is being prepared", () => {
    render(<StatusNarrative phase="launching" icon={<span data-testid="icon" />} />);
    expect(screen.getByText("Opening the secure capture window…")).toBeTruthy();
    expect(screen.getByTestId("icon")).toBeTruthy();
  });

  it("shows the capture instruction line while Smile ID is open", () => {
    render(<StatusNarrative phase="capturing" icon={<span data-testid="icon" />} />);
    expect(screen.getByText("Complete the check in the Smile ID window…")).toBeTruthy();
  });

  it("starts the processing cycle on the brief's first line", () => {
    render(<StatusNarrative phase="processing" icon={<span data-testid="icon" />} />);
    expect(screen.getByText("Uploading…")).toBeTruthy();
  });

  // Real timers: the cycle is a 3s interval and AnimatePresence drives the
  // swap — fake timers don't reliably advance motion's exit animation.
  it("cycles to the next processing line after the interval", async () => {
    render(<StatusNarrative phase="processing" icon={<span data-testid="icon" />} />);
    const next = KYC_NARRATIVE_LINES.processing[1];
    expect(await screen.findByText(next, {}, { timeout: 4500 })).toBeTruthy();
  }, 10000);
});
