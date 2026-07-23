import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRef } from "react";
import { useClickOutside } from "./useClickOutside";

function fireMouseDown(target) {
  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
}

describe("useClickOutside", () => {
  it("calls onOutside when a mousedown lands outside the ref'd element", () => {
    const inside = document.createElement("div");
    const outside = document.createElement("div");
    document.body.append(inside, outside);
    const onOutside = vi.fn();

    renderHook(() => {
      const ref = useRef(inside);
      useClickOutside(ref, onOutside);
    });

    act(() => fireMouseDown(outside));
    expect(onOutside).toHaveBeenCalledTimes(1);

    inside.remove();
    outside.remove();
  });

  it("does not call onOutside for a mousedown inside the ref'd element", () => {
    const inside = document.createElement("div");
    const child = document.createElement("span");
    inside.appendChild(child);
    document.body.appendChild(inside);
    const onOutside = vi.fn();

    renderHook(() => {
      const ref = useRef(inside);
      useClickOutside(ref, onOutside);
    });

    act(() => fireMouseDown(child));
    expect(onOutside).not.toHaveBeenCalled();

    inside.remove();
  });

  it("does not attach a listener when active is false", () => {
    const inside = document.createElement("div");
    const outside = document.createElement("div");
    document.body.append(inside, outside);
    const onOutside = vi.fn();

    renderHook(() => {
      const ref = useRef(inside);
      useClickOutside(ref, onOutside, false);
    });

    act(() => fireMouseDown(outside));
    expect(onOutside).not.toHaveBeenCalled();

    inside.remove();
    outside.remove();
  });

  it("stops listening after unmount", () => {
    const inside = document.createElement("div");
    const outside = document.createElement("div");
    document.body.append(inside, outside);
    const onOutside = vi.fn();

    const { unmount } = renderHook(() => {
      const ref = useRef(inside);
      useClickOutside(ref, onOutside);
    });

    unmount();
    act(() => fireMouseDown(outside));
    expect(onOutside).not.toHaveBeenCalled();

    inside.remove();
    outside.remove();
  });
});
