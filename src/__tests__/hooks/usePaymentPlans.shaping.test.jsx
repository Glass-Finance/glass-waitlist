import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { getCommunityPaymentLinks } from "../../api/payments";

// shapePlan is module-private, so this exercises it the only way it's
// reachable: through the hook, against a mocked API response.
//
// The point of this file is narrow. EditPlanModal hydrates its amount-mode,
// visibility, audience and member-selection controls from the plan object
// this hook returns. shapePlan used to drop all four, which left the edit
// modal rendering defaults for a link that had, say, a PRIVATE audience — and
// every modal test still passed, because they inject the plan directly. This
// is the seam where that class of bug is visible.
vi.mock("../../api/payments", () => ({
  getCommunityPaymentLinks: vi.fn(),
  createPaymentLink: vi.fn(),
  updatePaymentLink: vi.fn(),
  activatePaymentLink: vi.fn(),
  pausePaymentLink: vi.fn(),
  resumePaymentLink: vi.fn(),
  expirePaymentLink: vi.fn(),
  archivePaymentLink: vi.fn(),
  duplicatePaymentLink: vi.fn(),
}));

const COMMUNITY_ID = "community-1";

function renderPlans() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => usePaymentPlans(COMMUNITY_ID), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePaymentPlans — shaping the editable plan terms", () => {
  it("passes amountMode, audience, visibility and memberIds through to the plan", async () => {
    // Exactly the shape PaymentLinkResponse returns at the root.
    getCommunityPaymentLinks.mockResolvedValue({
      data: {
        data: {
          content: [
            {
              id: "link-1",
              title: "Term Fees",
              paymentType: "ONE_TIME",
              status: "ACTIVE",
              amount: 0,
              amountMode: "VARIABLE",
              audience: "SELECTED_MEMBERS",
              visibility: "PRIVATE",
              memberIds: ["member-a", "member-b"],
              metrics: {},
            },
          ],
        },
      },
    });

    const { result } = renderPlans();

    await waitFor(() => expect(result.current.plans).toHaveLength(1));
    expect(result.current.plans[0]).toMatchObject({
      amountMode: "VARIABLE",
      audience: "SELECTED_MEMBERS",
      visibility: "PRIVATE",
      memberIds: ["member-a", "member-b"],
    });
  });

  it("falls back to the documented defaults when the fields are absent", async () => {
    // Older/partial payloads must still produce a usable plan object rather
    // than undefined, or the edit modal's controlled selects go blank.
    getCommunityPaymentLinks.mockResolvedValue({
      data: { data: { content: [{ id: "link-2", title: "Dues", status: "ACTIVE" }] } },
    });

    const { result } = renderPlans();

    await waitFor(() => expect(result.current.plans).toHaveLength(1));
    expect(result.current.plans[0]).toMatchObject({
      amountMode: "FIXED",
      audience: "ALL_MEMBERS",
      visibility: "PUBLIC",
      memberIds: [],
    });
  });
});
