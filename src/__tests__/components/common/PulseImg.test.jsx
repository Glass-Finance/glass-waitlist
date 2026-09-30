import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import PulseImg from "../../../components/common/PulseImg";

// PulseImg is the shared avatar/logo <img> for every small remote asset in the
// app. All four of its consumers pass a URL straight from an API payload —
// `user.profileImage.url` (/user/me, via AuthContext), `logo.url` (invites)
// and `item.logo.url` (admin payments) — so the scheme is attacker-influenced.
// These tests pin the contract of the sink: only a value returned by
// safeImageUrl() may reach <img src>, and a rejected URL must take the same
// no-render path a missing src already took.

function renderPulse(props) {
  const { container } = render(<PulseImg {...props} />);
  return container;
}

describe("PulseImg source URL validation", () => {
  describe("accepted URLs render unchanged", () => {
    it("renders a valid https URL and preserves it exactly", () => {
      const src = "https://res.cloudinary.com/demo/image/upload/avatar.png";
      const container = renderPulse({ src, alt: "Avatar" });

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img.getAttribute("src")).toBe(src);
    });

    it("renders a valid http URL", () => {
      const src = "http://cdn.example.com/avatar.png";
      const container = renderPulse({ src });

      expect(container.querySelector("img").getAttribute("src")).toBe(src);
    });

    it("renders a valid blob: URL", () => {
      const src = "blob:http://localhost:5173/9f1c-4b2e";
      const container = renderPulse({ src });

      expect(container.querySelector("img").getAttribute("src")).toBe(src);
    });

    it("renders a valid root-relative path", () => {
      const src = "/uploads/a.png";
      const container = renderPulse({ src });

      expect(container.querySelector("img").getAttribute("src")).toBe(src);
    });
  });

  describe("rejected URLs render nothing", () => {
    it("renders no <img> for a javascript: URL and keeps the value out of the DOM", () => {
      const malicious = "javascript:alert(document.domain)";
      const container = renderPulse({ src: malicious });

      expect(container.querySelector("img")).toBeNull();
      expect(container.innerHTML).not.toContain(malicious);
    });

    it("renders no <img> for a data: URL", () => {
      const container = renderPulse({
        src: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      });

      expect(container.querySelector("img")).toBeNull();
    });

    it("renders no <img> for a protocol-relative URL", () => {
      const container = renderPulse({ src: "//evil.example/x.png" });

      expect(container.querySelector("img")).toBeNull();
    });

    it("renders no <img> for control-character scheme smuggling", () => {
      const container = renderPulse({ src: "java\tscript:alert(1)" });

      expect(container.querySelector("img")).toBeNull();
    });

    it("renders no <img> for other rejected schemes", () => {
      for (const src of ["vbscript:msgbox(1)", "file:///etc/passwd", "ftp://h/x.png"]) {
        expect(renderPulse({ src }).querySelector("img")).toBeNull();
      }
    });
  });

  describe("falsy and non-string sources keep the existing no-render path", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["empty string", ""],
    ])("renders nothing for %s", (_label, src) => {
      const container = renderPulse({ src });

      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector("span")).toBeNull();
    });

    it("renders nothing for non-string input without throwing", () => {
      for (const src of [{ url: "https://x/y.png" }, 42, true, ["https://x/y.png"]]) {
        expect(() => renderPulse({ src })).not.toThrow();
      }
    });
  });

  describe("srcSet cannot bypass the validated src", () => {
    it("does not let a caller inject a srcset attribute", () => {
      const container = renderPulse({
        src: "https://cdn.example.com/avatar.png",
        srcSet: "javascript:alert(1) 1x, https://evil.example/x.png 2x",
      });

      expect(container.querySelector("img").getAttribute("srcset")).toBeNull();
    });

    it("keeps the validated src when a srcset is also supplied", () => {
      const src = "https://cdn.example.com/avatar.png";
      const container = renderPulse({ src, srcSet: "https://evil.example/x.png 2x" });

      const img = container.querySelector("img");
      expect(img.getAttribute("src")).toBe(src);
      expect(img.getAttribute("srcset")).toBeNull();
    });

    it("renders nothing when only an unvalidated srcset is supplied", () => {
      const container = renderPulse({ srcSet: "https://evil.example/x.png 2x" });

      expect(container.querySelector("img")).toBeNull();
    });
  });

  describe("prop ordering cannot override the validated src", () => {
    it("wins over an explicit src spread into imgProps-shaped props", () => {
      const src = "https://cdn.example.com/avatar.png";
      const container = renderPulse({ src, alt: "a", width: 32, height: 32 });

      const img = container.querySelector("img");
      expect(img.getAttribute("src")).toBe(src);
      expect(img.getAttribute("src")).toBe("https://cdn.example.com/avatar.png");
    });

    it("keeps forwarding legitimate attributes through ...imgProps", () => {
      const onError = vi.fn();
      const container = renderPulse({
        src: "https://cdn.example.com/avatar.png",
        alt: "Ava",
        width: 32,
        height: 32,
        loading: "lazy",
        style: { borderRadius: "50%" },
        onError,
        "aria-hidden": "true",
        "data-testid": "avatar",
      });

      const img = container.querySelector("img");
      expect(img.getAttribute("width")).toBe("32");
      expect(img.getAttribute("height")).toBe("32");
      expect(img.getAttribute("loading")).toBe("lazy");
      expect(img.getAttribute("aria-hidden")).toBe("true");
      expect(img.getAttribute("data-testid")).toBe("avatar");
      expect(img.style.borderRadius).toBe("50%");

      // onError must survive the spread and stay attached.
      fireEvent.error(img);
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe("existing presentation behaviour is preserved", () => {
    it("passes alt through to the img", () => {
      const container = renderPulse({ src: "https://cdn.example.com/a.png", alt: "Ada Lovelace" });

      expect(container.querySelector("img").getAttribute("alt")).toBe("Ada Lovelace");
    });

    it("defaults alt to an empty string when not supplied", () => {
      const container = renderPulse({ src: "https://cdn.example.com/a.png" });

      expect(container.querySelector("img").getAttribute("alt")).toBe("");
    });

    it("applies className to the wrapper and imgClassName to the img", () => {
      const container = renderPulse({
        src: "https://cdn.example.com/a.png",
        className: "w-full h-full",
        imgClassName: "rounded-full",
      });

      const wrapper = container.firstElementChild;
      expect(wrapper.className).toContain("relative");
      expect(wrapper.className).toContain("w-full h-full");
      expect(wrapper.className).not.toContain("rounded-full");

      const img = container.querySelector("img");
      expect(img.className).toContain("rounded-full");
      expect(img.className).toContain("w-full h-full");
    });

    it("renders the pulsing skeleton behind the img until load", () => {
      const container = renderPulse({
        src: "https://cdn.example.com/a.png",
        skeletonClassName: "bg-red-100",
      });

      const skeleton = container.querySelector('span[aria-hidden="true"]');
      expect(skeleton).not.toBeNull();
      expect(skeleton.className).toContain("animate-pulse");
      expect(skeleton.className).toContain("bg-red-100");
    });

    it("keeps object-cover and the pre-load opacity state, then swaps on load", () => {
      const container = renderPulse({ src: "https://cdn.example.com/a.png" });

      const img = container.querySelector("img");
      expect(img.className).toContain("object-cover");
      expect(img.className).toContain("opacity-0");
      expect(img.getAttribute("decoding")).toBe("async");

      fireEvent.load(img);
      expect(container.querySelector("img").className).toContain("opacity-100");
    });
  });

  // The four real consumers were verified statically during the audit:
  //   dashboard/Topbar.jsx:421              src={user.profileImage.url}
  //   dashboard/NotificationsPanel.jsx:64   src={user.profileImage.url}
  //   dashboard/AdminPaymentModal.jsx:218   src={item.logo.url}
  //   memberApp/InvitePopup.jsx:29           src={logo.url}
  // All four pass plain remote URLs, which safeImageUrl accepts verbatim, so the
  // shapes are reproduced here against PulseImg directly rather than mounting
  // four screen components with their full auth/router/query setup.
  describe("real caller shapes still render with valid URLs", () => {
    it("renders the user.profileImage.url shape (Topbar, NotificationsPanel)", () => {
      const user = { profileImage: { url: "https://cdn.example.com/me.png" } };
      const container = renderPulse({ src: user.profileImage.url });

      expect(container.querySelector("img").getAttribute("src")).toBe(
        "https://cdn.example.com/me.png",
      );
    });

    it("renders the item.logo.url shape (AdminPaymentModal)", () => {
      const item = { logo: { url: "https://cdn.example.com/community.png" } };
      const container = renderPulse({ src: item.logo.url });

      expect(container.querySelector("img").getAttribute("src")).toBe(
        "https://cdn.example.com/community.png",
      );
    });

    it("renders the logo.url shape (InvitePopup)", () => {
      const logo = { url: "https://cdn.example.com/invite.png" };
      const container = renderPulse({ src: logo.url });

      expect(container.querySelector("img").getAttribute("src")).toBe(
        "https://cdn.example.com/invite.png",
      );
    });

    it("renders nothing for those shapes when the server value is unsafe", () => {
      const user = { profileImage: { url: "javascript:alert(1)" } };
      const item = { logo: { url: "javascript:alert(1)" } };

      expect(renderPulse({ src: user.profileImage.url }).querySelector("img")).toBeNull();
      expect(renderPulse({ src: item.logo.url }).querySelector("img")).toBeNull();
    });
  });
});
