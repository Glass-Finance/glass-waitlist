import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import CrispChat from "../../../components/common/CrispChat";

const { crisp, auth } = vi.hoisted(() => ({
  crisp: {
    configure: vi.fn(),
    user: { setEmail: vi.fn(), setNickname: vi.fn(), setPhone: vi.fn() },
    session: { setData: vi.fn(), reset: vi.fn() },
    setTokenId: vi.fn(),
  },
  auth: { user: null, loading: false },
}));

vi.mock("crisp-sdk-web", () => ({ Crisp: crisp }));
vi.mock("../../../store/AuthContext.jsx", () => ({ useAuth: () => auth }));

describe("CrispChat", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CRISP_WEBSITE_ID", "test-website-id");
    vi.clearAllMocks();
    auth.user = null;
    auth.loading = false;
  });

  afterEach(() => vi.unstubAllEnvs());

  it("loads chat for an anonymous visitor", () => {
    render(<CrispChat />);

    expect(crisp.configure).toHaveBeenCalledWith("test-website-id");
    expect(crisp.user.setEmail).not.toHaveBeenCalled();
  });

  it("sends the selected profile fields when a visitor signs in", () => {
    const view = render(<CrispChat />);
    auth.user = {
      id: "user-123",
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Okafor",
      phoneNumber: "+2348012345678",
      role: "USER",
    };
    view.rerender(<CrispChat />);

    expect(crisp.user.setEmail).toHaveBeenCalledWith("ada@example.com");
    expect(crisp.user.setNickname).toHaveBeenCalledWith("Ada Okafor");
    expect(crisp.user.setPhone).toHaveBeenCalledWith("+2348012345678");
    expect(crisp.session.setData).toHaveBeenCalledWith({ role: "USER" });
  });

  it("resets the conversation when a signed-in visitor signs out", () => {
    auth.user = { id: "user-123", email: "ada@example.com" };
    const view = render(<CrispChat />);
    auth.user = null;
    view.rerender(<CrispChat />);

    expect(crisp.setTokenId).toHaveBeenCalledWith();
    expect(crisp.session.reset).toHaveBeenCalledOnce();
  });

  it("loads immediately while auth restoration is in progress", () => {
    auth.loading = true;
    render(<CrispChat />);
    expect(crisp.configure).toHaveBeenCalledWith("test-website-id");
    expect(crisp.user.setEmail).not.toHaveBeenCalled();
  });
});
