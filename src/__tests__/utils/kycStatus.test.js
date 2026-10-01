import { describe, it, expect } from "vitest";
import {
  kycStatusLabel,
  kycStatusStyle,
  idTypeLabel,
  ID_TYPE_OPTIONS,
  KYC_SUBMITTABLE_ID_TYPES,
  KYC_SUBMITTABLE_ID_TYPE_OPTIONS,
  isKycApproved,
  isKycTerminal,
  isKycInFlight,
  isKycGatedCommunityRequestError,
} from "../../utils/kycStatus";

// Predicate-matrix coverage for every KYC status/idType literal the frontend
// interprets (kyc-frontend-integration.md). If the backend adds a value,
// add it here first, then decide which predicate(s)/chip should accept it.
describe("kyc status predicates", () => {
  const ACCOUNT_AND_ATTEMPT = [
    // [status, approved, terminal]
    ["NOT_STARTED", false, false],
    ["PENDING", false, false],
    ["IN_REVIEW", false, false],
    ["APPROVED", true, false],
    ["REJECTED", false, true],
    ["ERROR", false, true],
    ["EXPIRED", false, true],
    ["REVOKED", false, true],
    // Attempt-only states that share the axis
    ["INITIATED", false, false],
    ["PROCESSING", false, false],
    // Different axis / unknown — must never look approved or terminal
    ["ACTIVE", false, false],
    ["SUCCESS", false, false],
    ["UNVERIFIED", false, false],
  ];

  it.each(ACCOUNT_AND_ATTEMPT)("%s → approved=%s terminal=%s", (status, approved, terminal) => {
    expect(isKycApproved(status)).toBe(approved);
    expect(isKycTerminal(status)).toBe(terminal);
  });

  it("accepts any case", () => {
    expect(isKycApproved("approved")).toBe(true);
    expect(isKycApproved("Approved")).toBe(true);
    expect(isKycTerminal("rejected")).toBe(true);
    expect(isKycTerminal("Error")).toBe(true);
  });

  it("treats missing statuses as non-matching, never throwing", () => {
    expect(isKycApproved(null)).toBe(false);
    expect(isKycApproved(undefined)).toBe(false);
    expect(isKycApproved("")).toBe(false);
    expect(isKycTerminal(null)).toBe(false);
    expect(isKycTerminal(undefined)).toBe(false);
    expect(isKycTerminal("")).toBe(false);
  });

  // In-flight = exactly the statuses the verification modal's live
  // narrative + bounded refetch run against — nothing settled, nothing idle.
  it("in-flight covers exactly the moving statuses", () => {
    ["PENDING", "INITIATED", "PROCESSING"].forEach((s) => expect(isKycInFlight(s)).toBe(true));
    ["NOT_STARTED", "IN_REVIEW", "APPROVED", "REJECTED", "ERROR", "EXPIRED", "REVOKED"].forEach(
      (s) => expect(isKycInFlight(s)).toBe(false),
    );
    expect(isKycInFlight(null)).toBe(false);
    expect(isKycInFlight("pending")).toBe(true);
  });
});

describe("kyc status labels and styles", () => {
  const LABELS = [
    ["NOT_STARTED", "Not started"],
    ["PENDING", "Pending"],
    ["IN_REVIEW", "In review"],
    ["APPROVED", "Approved"],
    ["REJECTED", "Rejected"],
    ["ERROR", "Error"],
    ["EXPIRED", "Expired"],
    ["REVOKED", "Revoked"],
    ["INITIATED", "In progress"],
    ["PROCESSING", "Processing"],
  ];

  it.each(LABELS)("%s → %s", (status, label) => {
    expect(kycStatusLabel(status)).toBe(label);
    expect(kycStatusStyle(status).label).toBe(label);
    expect(kycStatusStyle(status).cls).toBeTruthy();
    // status pill dot color rides along with the chip style
    expect(kycStatusStyle(status).dot).toBeTruthy();
  });

  it("folds case and falls back for unknown/missing", () => {
    expect(kycStatusLabel("approved")).toBe("Approved");
    expect(kycStatusLabel(null)).toBe("—");
    expect(kycStatusLabel("SOMETHING_NEW")).toBe("—");
    expect(kycStatusStyle(undefined).label).toBe("—");
    expect(kycStatusStyle("SOMETHING_NEW").cls).toContain("bg-stacked-container");
  });
});

describe("id type labels", () => {
  it("maps every Nigeria enum value the backend has ever accepted", () => {
    // Label map stays complete: an attempt persisted with a retired value
    // must still render. Only the picker is narrowed — see the submittable
    // set test below.
    const values = ID_TYPE_OPTIONS.map((o) => o.value);
    expect(values).toEqual(["BVN", "VOTER_ID", "V_NIN", "NIN_SLIP", "NIN_V2"]);
    expect(idTypeLabel("BVN")).toBe("BVN");
    expect(idTypeLabel("VOTER_ID")).toBe("Voter's card");
    expect(idTypeLabel("V_NIN")).toBe("Virtual NIN");
    expect(idTypeLabel("NIN_SLIP")).toBe("NIN slip");
    expect(idTypeLabel("NIN_V2")).toBe("NIN");
  });

  it("offers only backend-accepted id types for a new attempt", () => {
    // KycIdType is exactly BVN/NIN_V2 now; anything else in the picker is
    // a server-side rejection.
    expect(KYC_SUBMITTABLE_ID_TYPES).toEqual(["BVN", "NIN_V2"]);
    expect(KYC_SUBMITTABLE_ID_TYPE_OPTIONS.map((o) => o.value)).toEqual(["BVN", "NIN_V2"]);
    // Derived, not a second hand-maintained list.
    expect(KYC_SUBMITTABLE_ID_TYPE_OPTIONS.every((o) => ID_TYPE_OPTIONS.includes(o))).toBe(true);
    // The default the flow starts on must be offered.
    expect(KYC_SUBMITTABLE_ID_TYPE_OPTIONS.map((o) => o.value)).toContain("BVN");
  });

  it("passes through unknown ids and handles nullish", () => {
    expect(idTypeLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    expect(idTypeLabel(null)).toBe("—");
    expect(idTypeLabel(undefined)).toBe("—");
  });
});

// The Members/Groups pages use this to tell a KYC-downgrade 403 apart from
// every other failure. The load-bearing case is the one whose message does NOT
// mention KYC: AccessControlService.requirePermission throws the generic
// "Community permission is required: <perm>" after silently downgrading the
// account's permissions, so isKycRequiredError alone would never fire.
describe("isKycGatedCommunityRequestError", () => {
  const downgrade403 = (
    description = "Community permission is required: community.members.read",
  ) => ({
    response: { status: 403, data: { description } },
  });
  const settled = { isLoading: false, isError: false, exempt: false };

  it("matches a plain 403 when the KYC status is known and not approved", () => {
    expect(isKycGatedCommunityRequestError(downgrade403(), "NOT_STARTED", settled)).toBe(true);
    expect(isKycGatedCommunityRequestError(downgrade403(), "IN_REVIEW", settled)).toBe(true);
    expect(isKycGatedCommunityRequestError(downgrade403(), "REJECTED", settled)).toBe(true);
  });

  it("does not match a 403 that isn't a community-permission refusal", () => {
    // The honest case: an incomplete-KYC account hitting a community they're
    // not an admin of (via ?community=) gets refused for an unrelated reason.
    // Telling them "your community role is active" would be wrong.
    expect(
      isKycGatedCommunityRequestError(
        { response: { status: 403, data: { description: "Forbidden" } } },
        "NOT_STARTED",
        settled,
      ),
    ).toBe(false);
    // No description at all -- nothing to attribute it to.
    expect(
      isKycGatedCommunityRequestError(
        { response: { status: 403, data: {} } },
        "NOT_STARTED",
        settled,
      ),
    ).toBe(false);
  });

  it("ignores the permission name in the message so it can change", () => {
    // Matched on the prefix only: the backend currently reports
    // community.members.read for the groups list too, and that name is free to
    // change without breaking the explanation.
    expect(
      isKycGatedCommunityRequestError(
        downgrade403("Community permission is required: community.some.future.permission"),
        "NOT_STARTED",
        settled,
      ),
    ).toBe(true);
  });

  it("does not match once the account is approved", () => {
    expect(isKycGatedCommunityRequestError(downgrade403(), "APPROVED", settled)).toBe(false);
  });

  it("does not guess while the status is still loading", () => {
    // A 403 that lands before /kyc settles is not evidence of anything yet.
    expect(
      isKycGatedCommunityRequestError(downgrade403(), null, { ...settled, isLoading: true }),
    ).toBe(false);
  });

  it("does not blame KYC when the summary request itself failed", () => {
    // An outage of /kyc must not send a user off to verify for no reason.
    expect(
      isKycGatedCommunityRequestError(downgrade403(), null, { ...settled, isError: true }),
    ).toBe(false);
  });

  it("does not match when there is no KYC record at all", () => {
    expect(isKycGatedCommunityRequestError(downgrade403(), null, settled)).toBe(false);
  });

  it("never matches a non-403", () => {
    for (const status of [400, 404, 409, 500, 503]) {
      expect(
        isKycGatedCommunityRequestError({ response: { status, data: {} } }, "NOT_STARTED", settled),
      ).toBe(false);
    }
    expect(isKycGatedCommunityRequestError(null, "NOT_STARTED", settled)).toBe(false);
    expect(isKycGatedCommunityRequestError(undefined, "NOT_STARTED", settled)).toBe(false);
  });

  it("never matches for an exempt account, whatever the status says", () => {
    // Platform staff are backend-exempt from the downgrade, and the kill
    // switch means KYC isn't in play at all -- so a 403 they hit is unrelated.
    const exempt = { ...settled, exempt: true };
    expect(isKycGatedCommunityRequestError(downgrade403(), "NOT_STARTED", exempt)).toBe(false);
    expect(
      isKycGatedCommunityRequestError(
        downgrade403("Approved KYC is required for community staff participation"),
        "NOT_STARTED",
        exempt,
      ),
    ).toBe(false);
  });

  it("still honours the backend's explicit KYC message without a status", () => {
    // Guards the case the status pair can't cover: the summary hasn't loaded
    // but the backend said KYC outright, so we already have proof.
    expect(
      isKycGatedCommunityRequestError(
        downgrade403("Approved KYC is required for community staff participation"),
        null,
        { isLoading: true, isError: false, exempt: false },
      ),
    ).toBe(true);
  });
});
