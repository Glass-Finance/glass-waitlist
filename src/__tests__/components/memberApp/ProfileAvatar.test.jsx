import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileAvatar from "../../../components/memberApp/ProfileAvatar";

// The member header's avatar: profile photo when the member has one (it
// reaches the browser through PulseImg's URL validation), initials on the
// brand gradient otherwise — the fallback that keeps the circle from
// rendering empty for members who never uploaded a photo.
describe("ProfileAvatar", () => {
  it("renders the member's photo when profileImage.url is set", () => {
    const { container } = render(
      <ProfileAvatar user={{ profileImage: { url: "/avatars/ada.png" } }} />,
    );

    // PulseImg's <img> carries alt="" (decorative — the button's own
    // aria-label names it), so query the element rather than by role.
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/avatars/ada.png");
  });

  it("falls back to first and last name initials", () => {
    render(<ProfileAvatar user={{ firstName: "ada", lastName: "obi" }} />);

    expect(screen.getByText("AO")).toBeDefined();
  });

  it("falls back to the email when the profile has no name yet", () => {
    render(<ProfileAvatar user={{ email: "grace.hopper@example.com" }} />);

    expect(screen.getByText("GR")).toBeDefined();
  });

  it("falls back to '?' when there is no user at all", () => {
    render(<ProfileAvatar user={null} />);

    expect(screen.getByText("?")).toBeDefined();
  });

  it("is a labelled button that fires onClick when given one", () => {
    const onClick = vi.fn();
    render(
      <ProfileAvatar user={{ firstName: "Ada" }} onClick={onClick} ariaLabel="Your profile" />,
    );

    fireEvent.click(screen.getByLabelText("Your profile"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders no button when no onClick is passed", () => {
    render(<ProfileAvatar user={{ firstName: "Ada" }} />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
