import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CommunityStaffKycNotice from "../../../components/dashboard/CommunityStaffKycNotice";

// Presentation-only component: it names the blocker and offers the way past it.
// The copy matters because this is the ONLY thing standing between a community
// admin and a bare "Community permission is required" with no explanation, so
// the assertions below are deliberately about the actionable wording rather
// than just "something rendered".

describe("CommunityStaffKycNotice", () => {
  it("states that approved identity verification is required", () => {
    render(<CommunityStaffKycNotice status="NOT_STARTED" />);

    expect(screen.getByText("Identity verification required")).toBeTruthy();
    expect(
      screen.getByText(/approved identity verification is required before you can view/i),
    ).toBeTruthy();
  });

  it("separates the KYC requirement from a permissions problem with the role", () => {
    // The whole point: the admin's role IS valid, and the copy must not imply
    // otherwise or they'll start editing roles looking for a fix.
    render(<CommunityStaffKycNotice status="NOT_STARTED" />);

    expect(screen.getByText(/not a permissions problem with your role/i)).toBeTruthy();
  });

  it("names the subject it is gating", () => {
    render(<CommunityStaffKycNotice status="NOT_STARTED" subject="your groups" />);

    expect(screen.getByText(/before you can view your groups/i)).toBeTruthy();
  });

  it("surfaces the current status when there is one", () => {
    render(<CommunityStaffKycNotice status="IN_REVIEW" />);

    expect(screen.getByText(/Current verification status:/i).textContent).toContain("In review");
  });

  it("offers a start action for a first-timer and a continue action mid-flow", () => {
    const { unmount } = render(
      <CommunityStaffKycNotice status="NOT_STARTED" onVerify={() => {}} />,
    );
    expect(screen.getByRole("button", { name: /Start verification/i })).toBeTruthy();
    unmount();

    render(<CommunityStaffKycNotice status="PROCESSING" onVerify={() => {}} />);
    expect(screen.getByRole("button", { name: /Continue verification/i })).toBeTruthy();
  });

  it("calls onVerify when the action is used", () => {
    const onVerify = vi.fn();
    render(<CommunityStaffKycNotice status="NOT_STARTED" onVerify={onVerify} />);

    screen.getByTestId("community-staff-kyc-verify").click();

    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  it("renders no action at all when onVerify is omitted", () => {
    // PR A wires no wizard, so the notice must be able to stand on its own
    // rather than rendering a dead button.
    render(<CommunityStaffKycNotice status="NOT_STARTED" />);

    expect(screen.queryByTestId("community-staff-kyc-verify")).toBeNull();
  });

  it("handles a missing status without throwing or mislabelling it", () => {
    render(<CommunityStaffKycNotice status={null} />);

    expect(screen.getByText("Identity verification required")).toBeTruthy();
    // kycStatusLabel falls back to an em dash; it must not be shown as if it
    // were a real status.
    expect(screen.queryByText(/Current verification status:/i)).toBeNull();
  });
});
