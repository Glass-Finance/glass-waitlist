import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { useJoinEmailParam } from "./useJoinEmailParam";

// Mirrors exactly how Join.jsx consumes this hook: seed a plain (non-lazy)
// useState argument from it on first render. React only ever consults that
// argument on mount, so this is the contract that actually matters -- not
// the hook's own live return value after its effect has already stripped
// the URL, which by design goes back to "" (see the hook's own comment).
function Consumer() {
  const joinEmail = useJoinEmailParam();
  const [captured] = useState(joinEmail);
  const [searchParams] = useSearchParams();
  return (
    <>
      <div data-testid="captured">{captured || "(empty)"}</div>
      <div data-testid="url-param">{searchParams.get("email") || "(stripped)"}</div>
    </>
  );
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Consumer />
    </MemoryRouter>,
  );
}

describe("useJoinEmailParam", () => {
  it("seeds a consumer's initial state with the ?email= value", () => {
    renderAt("/member/join?email=sulaimon%40example.com");
    expect(screen.getByTestId("captured").textContent).toBe("sulaimon@example.com");
  });

  it("captured state survives the URL being stripped afterward", async () => {
    renderAt("/member/join?email=sulaimon%40example.com");
    await waitFor(() => {
      expect(screen.getByTestId("url-param").textContent).toBe("(stripped)");
    });
    // The param is gone from the URL, but the value already seeded into
    // state at mount is untouched -- this is the whole point of the hook.
    expect(screen.getByTestId("captured").textContent).toBe("sulaimon@example.com");
  });

  it("captures nothing when no ?email= is present", () => {
    renderAt("/member/join");
    expect(screen.getByTestId("captured").textContent).toBe("(empty)");
  });

  it("leaves other query params (e.g. an invite ?token=) alone", async () => {
    function TokenConsumer() {
      const [searchParams] = useSearchParams();
      useJoinEmailParam();
      return <div data-testid="token">{searchParams.get("token") || "(gone)"}</div>;
    }
    render(
      <MemoryRouter initialEntries={["/member/join?token=abc123"]}>
        <TokenConsumer />
      </MemoryRouter>,
    );
    // Give the hook's effect a turn to run, then confirm it never touched
    // a param it wasn't looking for.
    await waitFor(() => {
      expect(screen.getByTestId("token").textContent).toBe("abc123");
    });
  });
});
