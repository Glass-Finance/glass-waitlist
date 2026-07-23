import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("only calls the setter once, after the delay, for a burst of calls", () => {
    const setter = vi.fn();
    const { result } = renderHook(() => useDebounce(setter, 350));

    act(() => {
      result.current("a");
      result.current("ab");
      result.current("abc");
    });

    expect(setter).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(setter).toHaveBeenCalledTimes(1);
    expect(setter).toHaveBeenCalledWith("abc");
  });

  it("does not fire before the delay has elapsed", () => {
    const setter = vi.fn();
    const { result } = renderHook(() => useDebounce(setter, 350));

    act(() => {
      result.current("x");
      vi.advanceTimersByTime(300);
    });

    expect(setter).not.toHaveBeenCalled();
  });

  it("defaults to a 350ms delay when none is given", () => {
    const setter = vi.fn();
    const { result } = renderHook(() => useDebounce(setter));

    act(() => {
      result.current("x");
      vi.advanceTimersByTime(349);
    });
    expect(setter).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(setter).toHaveBeenCalledWith("x");
  });
});
