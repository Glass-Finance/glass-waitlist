import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import CrispChat from "../../../components/common/CrispChat";

const { crisp, auth, tokenState } = vi.hoisted(() => ({
  crisp: {
    configure: vi.fn(),
    user: { setEmail: vi.fn(), setNickname: vi.fn(), setPhone: vi.fn() },
    session: { setData: vi.fn(), reset: vi.fn() },
    setTokenId: vi.fn(),
  },
  auth: { user: null, loading: false },
  tokenState: { value: undefined },
}));

vi.mock("crisp-sdk-web", () => ({ Crisp: crisp }));
vi.mock("../../../store/AuthContext.jsx", () => ({ useAuth: () => auth }));
vi.mock("../../../hooks/useCrispToken", () => ({
  useCrispToken: () => ({ data: tokenState.value }),
}));

const ADA = {
  id: "user-123",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Okafor",
  phoneNumber: "+2348012345678",
  role: "USER",
};

describe("CrispChat", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CRISP_WEBSITE_ID", "test-website-id");
    vi.clearAllMocks();
    auth.user = null;
    auth.loading = false;
    tokenState.value = undefined;
    // useRef state is per component instance: each render() starts fresh,
    // rerender() keeps it — so every test gets a clean binding state.
  });

  afterEach(() => vi.unstubAllEnvs());

  it("loads chat for an anonymous visitor", () => {
    render(<CrispChat />);

    expect(crisp.configure).toHaveBeenCalledWith("test-website-id", {
      sessionMerge: true,
    });
    expect(crisp.user.setEmail).not.toHaveBeenCalled();
    expect(crisp.setTokenId).not.toHaveBeenCalled();
  });

  it("identifies the visitor while the token query is still in flight", () => {
    auth.user = ADA;
    render(<CrispChat />);

    expect(crisp.user.setEmail).toHaveBeenCalledWith("ada@example.com");
    expect(crisp.user.setNickname).toHaveBeenCalledWith("Ada Okafor");
    expect(crisp.session.setData).toHaveBeenCalledWith({
      user_id: "user-123",
      role: "USER",
    });
    expect(crisp.setTokenId).not.toHaveBeenCalled();
  });

  it("binds the session token before resetting, then re-pushes identity", () => {
    auth.user = ADA;
    const view = render(<CrispChat />);
    tokenState.value = "secure-token-abc";
    view.rerender(<CrispChat />);

    expect(crisp.setTokenId).toHaveBeenCalledWith("secure-token-abc");
    expect(crisp.session.reset).toHaveBeenCalled();
    // Identity is pushed AFTER the reset (a reset wipes session data).
    const tokenOrder = crisp.setTokenId.mock.invocationCallOrder[0];
    const resetOrder = crisp.session.reset.mock.invocationCallOrder[0];
    const dataOrder = crisp.session.setData.mock.invocationCallOrder.at(-1);
    expect(tokenOrder).toBeLessThan(resetOrder);
    expect(resetOrder).toBeLessThan(dataOrder);
    expect(crisp.session.setData).toHaveBeenLastCalledWith({
      user_id: "user-123",
      role: "USER",
    });
  });

  it("keeps phone numbers out of the chat log (data minimization)", () => {
    auth.user = ADA;
    render(<CrispChat />);

    expect(crisp.user.setPhone).not.toHaveBeenCalled();
  });

  it("unbinds the session when the visitor signs out", () => {
    auth.user = ADA;
    const view = render(<CrispChat />);
    auth.user = null;
    view.rerender(<CrispChat />);

    expect(crisp.setTokenId).toHaveBeenCalledWith();
    expect(crisp.session.reset).toHaveBeenCalledOnce();
  });

  it("unbinds the previous account before identifying a new one", () => {
    auth.user = ADA;
    const view = render(<CrispChat />);
    auth.user = { id: "user-999", email: "kemi@example.com", role: "USER" };
    view.rerender(<CrispChat />);

    expect(crisp.setTokenId).toHaveBeenCalledWith();
    expect(crisp.session.reset).toHaveBeenCalled();
    expect(crisp.user.setEmail).toHaveBeenLastCalledWith("kemi@example.com");
    expect(crisp.session.setData).toHaveBeenLastCalledWith({
      user_id: "user-999",
      role: "USER",
    });
  });

  it("resolves a 404 token endpoint to no token (graceful degradation)", () => {
    auth.user = ADA;
    tokenState.value = null; // hook's 404 fallback
    render(<CrispChat />);

    expect(crisp.setTokenId).not.toHaveBeenCalled();
    expect(crisp.user.setEmail).toHaveBeenCalledWith("ada@example.com");
  });

  it("loads immediately while auth restoration is in progress", () => {
    auth.loading = true;
    render(<CrispChat />);
    expect(crisp.configure).toHaveBeenCalledWith("test-website-id", {
      sessionMerge: true,
    });
    expect(crisp.user.setEmail).not.toHaveBeenCalled();
  });
});
