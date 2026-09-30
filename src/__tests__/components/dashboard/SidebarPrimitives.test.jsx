import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { UserIdentity } from "../../../components/dashboard/SidebarPrimitives";

// `user.profileImage.url` reaches this component straight from the API via
// useAuth() -> AuthContext, so the scheme is attacker-influenced. These tests
// pin the contract of the sink: only a value returned by safeImageUrl() may
// reach <img src>, and anything rejected must fall back to the initials block
// instead of rendering an <img> at all.

function renderIdentity(profileImage) {
  const { container } = render(
    <UserIdentity
      user={profileImage === undefined ? {} : { profileImage }}
      initials="GN"
      displayName="Glass Nation"
    />,
  );
  return container;
}

describe("SidebarPrimitives.UserIdentity avatar image", () => {
  it("renders the image for a valid https URL", () => {
    const container = renderIdentity({
      url: "https://res.cloudinary.com/demo/image/upload/avatar.png",
    });

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://res.cloudinary.com/demo/image/upload/avatar.png");
  });

  it("renders the image for a valid http URL", () => {
    const container = renderIdentity({ url: "http://cdn.example.com/avatar.png" });

    expect(container.querySelector("img").getAttribute("src")).toBe(
      "http://cdn.example.com/avatar.png",
    );
  });

  it("renders the image for a blob: preview URL", () => {
    const container = renderIdentity({ url: "blob:http://localhost:5173/9f1c-4b2e" });

    expect(container.querySelector("img").getAttribute("src")).toBe(
      "blob:http://localhost:5173/9f1c-4b2e",
    );
  });

  it("preserves the existing layout, sizing and accessibility attributes", () => {
    const container = renderIdentity({ url: "https://cdn.example.com/avatar.png" });

    const img = container.querySelector("img");
    expect(img.getAttribute("class")).toBe("w-full h-full object-cover");
    expect(img.getAttribute("alt")).toBe("");
  });

  it("does not put a javascript: URL in the DOM and falls back to initials", () => {
    const container = renderIdentity({ url: "javascript:alert(document.domain)" });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("GN");
  });

  it("does not put a data: URL in the DOM", () => {
    const container = renderIdentity({
      url: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("GN");
  });

  it("rejects protocol-relative URLs, which would adopt the page scheme", () => {
    const container = renderIdentity({ url: "//evil.example/avatar.png" });

    expect(container.querySelector("img")).toBeNull();
  });

  it("rejects control-character scheme smuggling", () => {
    const container = renderIdentity({ url: "java\tscript:alert(1)" });

    expect(container.querySelector("img")).toBeNull();
  });

  it("falls back to initials when the user has no profile image", () => {
    const container = renderIdentity(undefined);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("GN");
  });

  it("falls back to initials when the user object itself is absent", () => {
    const { container } = render(
      <UserIdentity user={null} initials="GN" displayName="Glass Nation" />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("GN");
  });

  it("never leaks a rejected URL into any attribute of the rendered output", () => {
    const malicious = "javascript:alert(1)";
    const container = renderIdentity({ url: malicious });

    // Belt-and-braces: the rejected string must not survive anywhere in the DOM.
    expect(container.innerHTML).not.toContain(malicious);
  });
});
