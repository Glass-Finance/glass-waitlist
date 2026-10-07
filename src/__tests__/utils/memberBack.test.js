import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { goBackInApp } from "../../utils/memberBack";

function historyState(idx) {
  return idx === null ? {} : { idx };
}

describe("goBackInApp", () => {
  beforeEach(() => {
    // jsdom starts with a single history entry and no router state.
    window.history.replaceState(historyState(null), "");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pops back when an in-app entry exists (idx > 0)", () => {
    window.history.replaceState(historyState(2), "");
    const navigate = vi.fn();
    goBackInApp(navigate, "/member/home");
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it("falls back to the first parent on a cold entry (idx 0)", () => {
    window.history.replaceState(historyState(0), "");
    const navigate = vi.fn();
    goBackInApp(navigate, "/member/home");
    expect(navigate).toHaveBeenCalledWith("/member/home", { replace: true });
  });

  it("falls back when history has no router state at all", () => {
    window.history.replaceState({}, "");
    const navigate = vi.fn();
    goBackInApp(navigate, "/member/home");
    expect(navigate).toHaveBeenCalledWith("/member/home", { replace: true });
  });

  it("accepts a single string parent", () => {
    window.history.replaceState(historyState(0), "");
    const navigate = vi.fn();
    goBackInApp(navigate, "/member/settings");
    expect(navigate).toHaveBeenCalledWith("/member/settings", { replace: true });
  });

  it("uses the first parent of a fallback list", () => {
    window.history.replaceState(historyState(0), "");
    const navigate = vi.fn();
    goBackInApp(navigate, ["/dashboard/members", "/dashboard/admin"]);
    expect(navigate).toHaveBeenCalledWith("/dashboard/members", { replace: true });
  });

  it("defaults to /member/home when no parent is given", () => {
    window.history.replaceState(historyState(0), "");
    const navigate = vi.fn();
    goBackInApp(navigate);
    expect(navigate).toHaveBeenCalledWith("/member/home", { replace: true });
  });
});
