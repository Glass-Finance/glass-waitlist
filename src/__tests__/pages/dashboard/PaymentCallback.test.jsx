import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentCallback from "../../../pages/dashboard/PaymentCallback";
import { beginAuthGrace } from "../../../api/client";

vi.mock("../../../api/client", () => ({ beginAuthGrace: vi.fn() }));
vi.mock("../../../api/members", () => ({ verifyPayment: vi.fn() }));
vi.mock("../../../store/AuthContext", () => ({
  useAuth: vi.fn(() => ({ isAdmin: true, loading: false })),
}));
vi.mock("../../../hooks/usePageTitle", () => ({ usePageTitle: vi.fn() }));
vi.mock("../../../hooks/usePayments", () => ({
  settleLocalPaymentForReference: vi.fn(),
  peekPendingPaymentCtx: vi.fn(() => null),
  findAuthorisationForPlan: vi.fn(),
  fetchAuthorisationsOnce: vi.fn(),
}));
vi.mock("../../../components/LoadingScreen", () => ({ default: () => null }));
vi.mock("../../../pages/memberApp/PaymentSuccess", () => ({
  default: () => null,
}));
vi.mock("../../../components/common/SuccessBadge", () => ({
  default: () => null,
}));
vi.mock("../../../components/ui/Button", () => ({
  Button: ({ children }) => <button>{children}</button>,
}));

describe("PaymentCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens auth grace when the admin callback page mounts", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/payment/callback?reference=ref-1"]}>
          <PaymentCallback />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(beginAuthGrace).toHaveBeenCalledTimes(1);
  });
});