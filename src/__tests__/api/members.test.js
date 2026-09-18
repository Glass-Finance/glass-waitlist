import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import client from "../../api/client";
import {
  initiatePayment,
  verifyPayment,
  getMyObligations,
  getMyTransactions,
  getMyAuthorisations,
} from "../../api/members";

describe("members API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initiatePayment", () => {
    it("posts the payment payload to the payment-link endpoint", async () => {
      const payload = {
        idempotencyKey: "idem-123",
        amount: 500000,
        savePaymentMethod: true,
        obligationId: "obl-1",
        metadata: {
          source: "member",
        },
      };

      client.post.mockResolvedValue({
        data: {
          data: {
            transactionId: "tx-1",
            reference: "ref-1",
            authorizationUrl: "https://checkout.example.com/ref-1",
          },
        },
      });

      const result = await initiatePayment("link-1", payload);

      expect(client.post).toHaveBeenCalledWith(
        "/payments/pay/payment-links/link-1",
        payload,
      );

      expect(result.data.data.reference).toBe("ref-1");
    });
  });

  describe("verifyPayment", () => {
    it("sends the payment reference as a query parameter", async () => {
      client.post.mockResolvedValue({
        data: {
          data: {
            status: "SUCCESSFUL",
            reference: "ref-123",
            transactionId: "tx-123",
          },
        },
      });

      await verifyPayment("ref-123");

      expect(client.post).toHaveBeenCalledWith(
        "/payments/callback/verify",
        null,
        {
          params: {
            reference: "ref-123",
          },
        },
      );
    });

    it("preserves callback-specific axios config", async () => {
      await verifyPayment("ref-456", {
        _skipAuthRedirect: true,
      });

      expect(client.post).toHaveBeenCalledWith(
        "/payments/callback/verify",
        null,
        {
          params: {
            reference: "ref-456",
          },
          _skipAuthRedirect: true,
        },
      );
    });
  });

  describe("paginated member finance requests", () => {
    it("requests member obligations with the explicit page size", async () => {
      await getMyObligations();

      expect(client.get).toHaveBeenCalledWith(
        "/finance/obligations/me",
        {
          params: {
            pageSize: 200,
          },
        },
      );
    });

    it("requests member transactions with the explicit page size", async () => {
      await getMyTransactions();

      expect(client.get).toHaveBeenCalledWith(
        "/finance/transactions/me",
        {
          params: {
            pageSize: 200,
          },
        },
      );
    });

    it("requests member authorisations with the explicit page size", async () => {
      await getMyAuthorisations();

      expect(client.get).toHaveBeenCalledWith(
        "/finance/authorizations",
        {
          params: {
            pageSize: 100,
          },
        },
      );
    });

    it("merges extra config into the authorisations request", async () => {
      await getMyAuthorisations({
        _skipAuthRedirect: true,
      });

      expect(client.get).toHaveBeenCalledWith(
        "/finance/authorizations",
        {
          params: {
            pageSize: 100,
          },
          _skipAuthRedirect: true,
        },
      );
    });
  });
});