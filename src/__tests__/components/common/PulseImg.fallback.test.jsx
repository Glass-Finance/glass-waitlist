import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import PulseImg from "../../../components/common/PulseImg";

// Stored image URLs are not durable: they can be signed-and-expired, 404, or
// (as with the AWS -> Railway storage cutover) point at an origin that no
// longer answers. Before the `fallback` prop, a failed load left the <img> at
// opacity-0 behind its skeleton forever -- a bare coloured block, with the
// caller's initials never rendered.
describe("PulseImg fallback", () => {
  it("shows the fallback when the image fails to load", () => {
    const { container } = render(
      <PulseImg src="https://files.glasspay.app/public/logo.webp" fallback={<span>GC</span>} />,
    );
    fireEvent.error(container.querySelector("img"));
    expect(container.textContent).toContain("GC");
  });

  it("keeps the fallback out of the way until the load fails", () => {
    const { container } = render(
      <PulseImg src="https://cdn.example.com/ok.webp" fallback={<span>GC</span>} />,
    );
    expect(container.textContent).not.toContain("GC");
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("renders the fallback for an unsafe URL without issuing a request", () => {
    const { container } = render(<PulseImg src="javascript:alert(1)" fallback={<span>GC</span>} />);
    expect(container.textContent).toContain("GC");
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders nothing at all when there is no fallback and the URL is unusable", () => {
    // The original contract: an invalid URL stays invisible rather than
    // guessing a placeholder.
    const { container } = render(<PulseImg src="javascript:alert(1)" />);
    expect(container.firstChild).toBeNull();
  });

  it("centres the fallback in the box, not the top-left corner", () => {
    const { container } = render(<PulseImg src="javascript:alert(1)" fallback={<span>GC</span>} />);
    // The initials used to land in the top-left because PulseImg's wrapper is
    // a plain block and the fallback was a bare child of it.
    const layer = container.querySelector("span.absolute.inset-0");
    expect(layer).toBeTruthy();
    expect(layer.className).toContain("items-center");
    expect(layer.className).toContain("justify-center");
    expect(layer.textContent).toContain("GC");
  });

  it("calls a caller-supplied onError as well as falling back", () => {
    const onError = vi.fn();
    const { container } = render(
      <PulseImg
        src="https://files.glasspay.app/public/logo.webp"
        onError={onError}
        fallback={<span>GC</span>}
      />,
    );
    fireEvent.error(container.querySelector("img"));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("GC");
  });
});
