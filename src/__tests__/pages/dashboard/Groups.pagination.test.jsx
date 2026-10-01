import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Regression guard for a real 400 in production.
//
// The backend's createPageable() does `PageRequest.of(pageNumber - 1, ...)`,
// so page numbers are 1-BASED and its own default is AppConstant.PAGE_NUMBER = 1.
// Sending pageNumber: 0 therefore becomes PageRequest.of(-1, ...) and the
// request is rejected with 400 "Illegal Argument Entered" — the Groups list
// could not load at all.
//
// Deliberately NOT mocked at the useGroups boundary the way Groups.test.jsx
// does: mocking the hook would hide the very wiring under test (page state ->
// hook -> api). Here the real hook runs and only the api module is stubbed, so
// reverting the page back to useState(0) fails this suite.

vi.mock("../../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: () => "glass-crew",
}));
vi.mock("../../../hooks/useCommunityMembers", () => ({
  useCommunityMembers: () => ({ members: [], isLoading: false, error: null }),
}));
vi.mock("../../../hooks/usePageTitle", () => ({ usePageTitle: vi.fn() }));
// The page reads the account's KYC status so it can explain the 403 that a
// KYC-incomplete community admin gets from the groups endpoint. useKycGate
// needs an AuthProvider (useAuth) and issues a live /kyc summary request, so
// it's stubbed here to the benign already-approved state — it isn't part of
// the pagination wiring under test here. The gated-403 behaviour itself is
// covered in Groups.kycNotice.test.jsx.
vi.mock("../../../hooks/useKycGate", () => ({
  useKycGate: () => ({
    status: "APPROVED",
    isApproved: true,
    isLoading: false,
    isError: false,
    exempt: false,
  }),
}));

const { mockGet } = vi.hoisted(() => ({
  mockGet: { current: vi.fn() },
}));
vi.mock("../../../api/groups", () => ({
  getCommunityGroups: (...args) => mockGet.current(...args),
}));

const Groups = (await import("../../../pages/dashboard/Groups")).default;

// Axios shape: the hook unwraps `res.data.data`, so the paginated envelope has
// to sit two levels down, exactly as the real client returns it.
function axiosEnvelope(envelope) {
  return { data: { data: envelope } };
}

function envelope(overrides = {}) {
  return axiosEnvelope({
    content: [{ id: "g1", name: "Choir", status: "ACTIVE" }],
    totalElements: 45,
    totalPages: 3,
    pageNumber: 1,
    ...overrides,
  });
}

beforeEach(() => {
  mockGet.current = vi.fn().mockResolvedValue(envelope());
});

afterEach(() => vi.clearAllMocks());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/dashboard/groups?community=glass-crew"]}>
        <Groups />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Groups pagination is 1-based", () => {
  it("requests pageNumber 1 on first load, never 0", async () => {
    renderPage();

    await waitFor(() => expect(mockGet.current).toHaveBeenCalled());
    const [communityId, params] = mockGet.current.mock.calls[0];

    expect(communityId).toBe("glass-crew");
    expect(params.pageNumber).toBe(1);
  });

  it("walks forward within 1-based bounds and never below 1", async () => {
    const user = userEvent.setup();
    renderPage();

    // Wait for the resolved row, not just the request: asserting on the DOM
    // before the query settles races the loading state.
    await screen.findByText("Choir");
    expect(mockGet.current).toHaveBeenCalledTimes(1);
    expect(mockGet.current.mock.calls[0][1].pageNumber).toBe(1);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(mockGet.current).toHaveBeenCalledTimes(2));
    expect(mockGet.current.mock.calls[1][1].pageNumber).toBe(2);
    expect(screen.queryByText(/Page 2 of 3/)).not.toBeNull();

    // Going back to page 1 is served from cache (staleTime 30s), so no new
    // request is expected -- what matters is that the UI returns to page 1 and
    // that nothing ever asked for page 0.
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await waitFor(() => expect(screen.queryByText(/Page 1 of 3/)).not.toBeNull());

    const sent = mockGet.current.mock.calls.map(([, p]) => p.pageNumber);
    expect(Math.min(...sent)).toBe(1);
  });

  it("never requests page 0, however many times Previous is pressed", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Choir");
    const previous = screen.getByRole("button", { name: "Previous" });
    // Disabled on the first page: the floor is 1, not 0.
    expect(previous.disabled).toBe(true);
    await user.click(previous);
    await user.click(previous);

    const sent = mockGet.current.mock.calls.map(([, p]) => p.pageNumber);
    expect(Math.min(...sent)).toBeGreaterThanOrEqual(1);
  });

  it("displays the backend's 1-based page number verbatim", async () => {
    renderPage();

    await screen.findByText("Choir");
    // "Page 1 of 3" — a 0-based implementation would render "Page 2 of 3"
    // here, because it added 1 to the page it had just requested.
    expect(screen.queryByText(/Page 1 of 3/)).not.toBeNull();
  });
});

describe("useGroups normalises the page number to 1-based", () => {
  it("falls back to 1, not 0, when the envelope omits pageNumber", async () => {
    // Same 1-based contract as useKyc.js. A 0 fallback here would put the
    // backend in PageRequest.of(-1, ...) territory on the next request.
    const { useCommunityGroups } = await import("../../../hooks/useGroups");

    mockGet.current = vi
      .fn()
      .mockResolvedValue(axiosEnvelope({ content: [], totalElements: 0, totalPages: 1 }));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useCommunityGroups("glass-crew", { pageNumber: 1 }), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.pageNumber).toBe(1);
  });
});
