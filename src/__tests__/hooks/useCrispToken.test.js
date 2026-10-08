import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCrispToken } from "../../hooks/useCrispToken";

// The Crisp token is not fetched: AuthContext already holds the account's
// `externalReference` from GET /user/me, so this hook is a read. The return
// shape stays query-like (`{ data }`) because that is how CrispChat consumes it
// and how its tests mock it.

// vi.hoisted first: the mock factory below closes over `auth`, so it has to
// exist before vi.mock is hoisted above it.
const { auth } = vi.hoisted(() => ({ auth: { user: null } }));

// Resolves to the same module the hook imports ("../store/AuthContext.jsx"
// from src/hooks/).
vi.mock("../../store/AuthContext.jsx", () => ({ useAuth: () => auth }));

const REF = "0192f3c4-5d6e-7a8b-9c0d-1e2f3a4b5c6d";

describe("useCrispToken", () => {
  beforeEach(() => {
    auth.user = null;
  });

  it("returns the external reference held on the signed-in user", () => {
    auth.user = { id: "u1", externalReference: REF };
    const { result } = renderHook(() => useCrispToken());
    expect(result.current.data).toBe(REF);
  });

  it("returns null when signed out", () => {
    auth.user = null;
    const { result } = renderHook(() => useCrispToken());
    expect(result.current.data).toBeNull();
  });

  it("returns null for a user whose /me has not resolved yet", () => {
    // A session restored from localStorage has no externalReference until the
    // hydration call lands. Reporting "no token" (rather than throwing) keeps
    // CrispChat on its anonymous path until the value arrives.
    auth.user = { id: "u1" };
    const { result } = renderHook(() => useCrispToken());
    expect(result.current.data).toBeNull();
  });

  it("never returns the account id or email — only the opaque reference", () => {
    // Guards the property Crisp's docs care about: the token must not be
    // guessable from other identity data.
    auth.user = { id: "u1", email: "ada@example.com", externalReference: REF };
    const { result } = renderHook(() => useCrispToken());
    expect(result.current.data).not.toBe(auth.user.id);
    expect(result.current.data).not.toBe(auth.user.email);
  });
});
