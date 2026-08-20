import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePageTitle } from "../../hooks/usePageTitle";

describe("usePageTitle", () => {
  it("suffixes a given title with the app name", () => {
    renderHook(() => usePageTitle("Members"));
    expect(document.title).toBe("Members – Glasspay");
  });

  it("falls back to the bare app name when no title is given", () => {
    renderHook(() => usePageTitle(""));
    expect(document.title).toBe("Glasspay");
  });

  it("updates the title when it changes across a re-render", () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: "Payments" },
    });
    expect(document.title).toBe("Payments – Glasspay");

    rerender({ title: "Members" });
    expect(document.title).toBe("Members – Glasspay");
  });
});
