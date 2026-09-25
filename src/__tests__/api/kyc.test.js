import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import { startKycAttempt, refreshKycToken } from "../../api/kyc";

// Backend contract (from the backend team): when the frontend initiates a
// Smile ID challenge it must send the default result webhook so Glass can
// embed it in the job/token — without it the provider has nowhere to post
// the outcome and the attempt never settles. Start-attempt only: the
// refresh path re-mints from the attempt record, which already carries it.

vi.mock("../../api/client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const CALLBACK_URL = "https://api.glasspay.app/api/v1/webhooks/smile-id";

beforeEach(() => {
  client.post.mockReset();
  client.get.mockReset();
});

describe("startKycAttempt", () => {
  it("initiates the challenge with the default Smile ID callback URL", () => {
    startKycAttempt("BVN");

    expect(client.post).toHaveBeenCalledWith("/kyc/attempts", {
      idType: "BVN",
      callbackUrl: CALLBACK_URL,
    });
  });

  it("passes the idType through untouched", () => {
    startKycAttempt("NIN_V2");

    expect(client.post.mock.calls[0][1].idType).toBe("NIN_V2");
  });
});

describe("refreshKycToken", () => {
  it("re-mints without a body — the attempt record already carries the callback", () => {
    refreshKycToken("attempt-1");

    expect(client.post).toHaveBeenCalledWith("/kyc/attempts/attempt-1/token");
    expect(client.post.mock.calls[0]).toHaveLength(1);
  });
});
