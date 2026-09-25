import { describe, it, expect } from "vitest";
import {
  kycStatusLabel,
  kycStatusStyle,
  idTypeLabel,
  ID_TYPE_OPTIONS,
  isKycApproved,
  isKycTerminal,
  isKycInFlight,
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
  it("maps every Nigeria enum value from the KYC guide", () => {
    const values = ID_TYPE_OPTIONS.map((o) => o.value);
    expect(values).toEqual(["BVN", "VOTER_ID", "V_NIN", "NIN_SLIP", "NIN_V2"]);
    expect(idTypeLabel("BVN")).toBe("BVN");
    expect(idTypeLabel("VOTER_ID")).toBe("Voter's card");
    expect(idTypeLabel("V_NIN")).toBe("Virtual NIN");
    expect(idTypeLabel("NIN_SLIP")).toBe("NIN slip");
    expect(idTypeLabel("NIN_V2")).toBe("NIN");
  });

  it("passes through unknown ids and handles nullish", () => {
    expect(idTypeLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    expect(idTypeLabel(null)).toBe("—");
    expect(idTypeLabel(undefined)).toBe("—");
  });
});
