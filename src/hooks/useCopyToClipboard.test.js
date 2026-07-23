import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "./useCopyToClipboard";

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useCopyToClipboard", () => {
  it("writes the text to the clipboard and flips copied to true", async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current[0]).toBe(false);

    await act(async () => {
      result.current[1]("hello");
      await Promise.resolve();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
    expect(result.current[0]).toBe(true);
  });

  it("reverts copied to false after the default 2000ms", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current[1]("hello");
      await Promise.resolve();
    });
    expect(result.current[0]).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current[0]).toBe(false);
  });

  it("respects a custom duration", async () => {
    const { result } = renderHook(() => useCopyToClipboard(1500));

    await act(async () => {
      result.current[1]("hello");
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(1499);
    });
    expect(result.current[0]).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current[0]).toBe(false);
  });

  it("stringifies a non-string value before copying", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current[1](12345);
      await Promise.resolve();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("12345");
  });

  it("no-ops for a falsy value without touching the clipboard", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current[1]("");
      result.current[1](null);
      result.current[1](undefined);
    });

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(result.current[0]).toBe(false);
  });

  it("does not throw when the Clipboard API is unavailable", async () => {
    Object.assign(navigator, { clipboard: undefined });
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      expect(() => result.current[1]("hello")).not.toThrow();
    });
  });
});
