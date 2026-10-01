import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// The Members counterpart to Groups.kycNotice.test.jsx, and it exists for a
// different structural reason: Groups renders its error as a standalone
// paragraph, while Members renders it as a <tr> inside the table. The KYC
// notice therefore has to fit inside a table cell -- a block-level card in the
// wrong place would break the table layout, not just the copy.
//
// Same root cause on the wire: a COMMUNITY_OWNER whose KYC isn't APPROVED is
// silently downgraded to COMMUNITY_MEMBER permissions server-side, so
// GET /communities/{id}/members comes back 403 with the generic
// "Community permission is required: community.members.read" (verified live).

const { mockMembers, mockMemberMutations, mockKycGate } = vi.hoisted(() => ({
  mockMembers: { current: null },
  mockMemberMutations: { current: {} },
  mockKycGate: { current: null },
}));

vi.mock("../../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: () => "comm-1",
}));

vi.mock("../../../hooks/useCommunity", () => ({
  useCommunity: () => ({ data: { id: "comm-1", name: "Kings College Alumni", slug: "kca" } }),
}));

vi.mock("../../../hooks/useMembersWithPayments", () => ({
  useMembersWithPayments: () => mockMembers.current,
}));

vi.mock("../../../hooks/useCommunityMembers", () => ({
  useCommunityMembers: () => mockMemberMutations.current,
  useRoles: () => ({ data: [{ id: "role-1", name: "Community Member" }] }),
}));

vi.mock("../../../hooks/useJoinRequests", () => ({
  useJoinRequests: () => ({ requests: [], isLoading: false, error: null }),
  requestStatusOf: (r) => r?.status,
  requesterOf: (r) => r,
}));

vi.mock("../../../hooks/useKycGate", () => ({ useKycGate: () => mockKycGate.current }));

const Members = (await import("../../../pages/dashboard/Members")).default;

const notice = () => screen.queryByTestId("community-staff-kyc-notice");

// Verified live against the backend for a KYC-incomplete community owner.
const downgrade403 = () => ({
  response: {
    status: 403,
    data: { description: "Community permission is required: community.members.read" },
  },
});

const other403 = () => ({ response: { status: 403, data: { description: "Forbidden" } } });

const failed = (error) => ({ error });

const kyc = (status, extra = {}) => ({
  status,
  isApproved: false,
  isLoading: false,
  isError: false,
  exempt: false,
  ...extra,
});

function result(members, overrides = {}) {
  return {
    members,
    obligations: [],
    transactions: [],
    isLoading: false,
    error: null,
    ...overrides,
  };
}

function member(overrides = {}) {
  return {
    id: "member-1",
    firstName: "Amina",
    lastName: "Bello",
    email: "amina@example.com",
    role: { name: "Community Member", code: "COMMUNITY_MEMBER" },
    status: "ACTIVE",
    billingExempt: false,
    planCount: 1,
    paidCount: 1,
    totalCount: 1,
    failedCount: 0,
    obligations: [],
    transactions: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockKycGate.current = kyc("APPROVED", { isApproved: true });
  mockMembers.current = result([member()]);
  mockMemberMutations.current = {
    inviteMember: { mutateAsync: vi.fn(), isPending: false },
    removeMember: { mutate: vi.fn(), isPending: false },
  };
});

afterEach(() => vi.clearAllMocks());

function renderPage() {
  return render(
    <MemoryRouter>
      <Members />
    </MemoryRouter>,
  );
}

describe("Members KYC-gated 403", () => {
  it("explains the KYC requirement instead of 'Couldn't load members.'", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).not.toBeNull();
    expect(screen.getByText(/approved identity verification is required/i)).toBeTruthy();
    expect(screen.getByText(/before you can view your members list/i)).toBeTruthy();
    expect(screen.queryByText("Couldn't load members.")).toBeNull();
  });

  it("renders the notice inside the table so the layout survives", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    // A block-level card dropped anywhere but a cell would break the table.
    expect(notice().closest("td")).not.toBeNull();
  });

  it("does not claim there are no members -- a refusal is not an empty list", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).not.toBeNull();
    expect(screen.queryByText("No members found.")).toBeNull();
  });

  it("opens no wizard on load", () => {
    // PR A only states the situation; the verification flow is a separate
    // change. A modal appearing unbidden would also be the wrong UX for a page
    // the user might just be passing through.
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).not.toBeNull();
    expect(screen.queryByTestId("community-staff-kyc-verify")).toBeNull();
  });
});

describe("Members non-KYC failures keep their generic error", () => {
  it("keeps 'Couldn't load members.' for a 403 that isn't a permission refusal", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(other403()));

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Couldn't load members.")).toBeTruthy();
  });

  it("keeps the generic error while the KYC status is still loading", () => {
    mockKycGate.current = kyc(null, { isLoading: true });
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Couldn't load members.")).toBeTruthy();
  });

  it("keeps the generic error when the KYC summary request itself failed", () => {
    mockKycGate.current = kyc(null, { isError: true });
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Couldn't load members.")).toBeTruthy();
  });

  it("keeps the generic error for an exempt account", () => {
    mockKycGate.current = kyc("NOT_STARTED", { exempt: true });
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Couldn't load members.")).toBeTruthy();
  });
});

describe("Members normal access is untouched", () => {
  it("renders the members table for an approved admin", () => {
    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Amina Bello")).toBeTruthy();
  });

  it("still shows the empty state, never the notice, on a successful empty list", () => {
    // A community with genuinely no members renders EmptyState, not the table.
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([]);

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("No members yet.")).toBeTruthy();
  });

  it("still shows the in-table empty row, never the notice, when a search matches nothing", () => {
    // The notice branch sits directly above this row in the same ternary, so
    // this pins that the gated 403 didn't shadow the ordinary "no matches"
    // state. hasRealMembers is true here, so the table renders at all.
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([member()]);

    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search members…"), {
      target: { value: "zzzz-no-such-member" },
    });

    expect(notice()).toBeNull();
    expect(screen.getByText("No members found.")).toBeTruthy();
  });
});
