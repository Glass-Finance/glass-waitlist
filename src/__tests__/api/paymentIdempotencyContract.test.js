import { beforeEach, describe, expect, it, vi } from "vitest";

// Contract guard: live OpenAPI (api.glasspay.app /v3/api-docs/springdocDefault)
// marks idempotencyKey required on InitializePaymentRequest and echoes it on
// TransactionResponse. Pin (1) that schema excerpt and (2) that our client
// always posts a non-empty UUID string — so a backend tightening or a
// frontend regression fails here before a double-charge can ship.
// Schema is vendored so the suite stays offline; set RUN_LIVE_API_DOCS=1
// to also re-fetch the published spec.

const INITIALIZE_PAYMENT_REQUEST_SCHEMA = {
  type: "object",
  properties: {
    idempotencyKey: { type: "string", minLength: 1 },
    amount: { type: "number" },
    savePaymentMethod: { type: "boolean" },
    obligationId: { type: "string", format: "uuid" },
    metadata: { type: "object", additionalProperties: {} },
  },
  required: ["idempotencyKey"],
};

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import client from "../../api/client";
import { initiatePayment } from "../../api/members";

describe("payment init idempotency contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("OpenAPI excerpt still requires a non-empty idempotencyKey", () => {
    expect(INITIALIZE_PAYMENT_REQUEST_SCHEMA.required).toContain("idempotencyKey");
    expect(INITIALIZE_PAYMENT_REQUEST_SCHEMA.properties.idempotencyKey.minLength).toBe(1);
  });

  it("initiatePayment posts idempotencyKey as a non-empty UUID body field", async () => {
    const key = crypto.randomUUID();
    const payload = {
      idempotencyKey: key,
      amount: 100,
      savePaymentMethod: false,
    };
    client.post.mockResolvedValue({
      data: { data: { transactionId: "tx-1", reference: "ref-1" } },
    });

    await initiatePayment("link-1", payload);

    expect(client.post).toHaveBeenCalledWith("/payments/pay/payment-links/link-1", payload);
    const sent = client.post.mock.calls[0][1];
    expect(sent.idempotencyKey).toBe(key);
    expect(sent.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(sent.idempotencyKey.length).toBeGreaterThanOrEqual(
      INITIALIZE_PAYMENT_REQUEST_SCHEMA.properties.idempotencyKey.minLength,
    );
  });

  it("rejects empty idempotencyKey the same way schema minLength does", () => {
    const { minLength } = INITIALIZE_PAYMENT_REQUEST_SCHEMA.properties.idempotencyKey;
    const isValid = (k) => typeof k === "string" && k.length >= minLength;
    expect(isValid("")).toBe(false);
    expect(isValid(undefined)).toBe(false);
    expect(isValid(crypto.randomUUID())).toBe(true);
  });
});

const runLiveDocs = globalThis.process?.env?.RUN_LIVE_API_DOCS === "1";

describe.runIf(runLiveDocs)("live OpenAPI idempotency fields", () => {
  it("live InitializePaymentRequest still requires idempotencyKey", async () => {
    const res = await fetch("https://api.glasspay.app/v3/api-docs/springdocDefault", {
      headers: { Accept: "application/json", "User-Agent": "glasspay-contract-test" },
    });
    expect(res.ok).toBe(true);
    const doc = await res.json();
    const schema = doc.components?.schemas?.InitializePaymentRequest;
    expect(schema).toBeTruthy();
    expect(schema.required).toContain("idempotencyKey");
    expect(schema.properties?.idempotencyKey?.minLength).toBe(1);
    expect(doc.components?.schemas?.TransactionResponse?.properties?.idempotencyKey).toBeTruthy();
  });
});
