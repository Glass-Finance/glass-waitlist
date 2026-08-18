import { describe, it, expect } from "vitest";
import {
  isPaymentNotificationType,
  isPaymentReceivedType,
  isSelfAccountType,
  notificationVisual,
  notificationCategory,
  notificationTypeTarget,
} from "../../utils/notificationTypes";

describe("isPaymentNotificationType", () => {
  it("is true for a payment-lifecycle type", () => {
    expect(isPaymentNotificationType("PAYMENT_OVERDUE")).toBe(true);
  });
  it("is case-insensitive", () => {
    expect(isPaymentNotificationType("payment_overdue")).toBe(true);
  });
  it("is false for a non-payment type or missing type", () => {
    expect(isPaymentNotificationType("JOIN_REQUEST_CREATED")).toBe(false);
    expect(isPaymentNotificationType(undefined)).toBe(false);
  });
});

describe("isPaymentReceivedType", () => {
  it("is true only for PAYMENT_RECEIVED, not other payment types", () => {
    expect(isPaymentReceivedType("PAYMENT_RECEIVED")).toBe(true);
    expect(isPaymentReceivedType("PAYMENT_DUE")).toBe(false);
  });
});

describe("isSelfAccountType", () => {
  it("is true for account-level types", () => {
    expect(isSelfAccountType("PASSWORD_UPDATED")).toBe(true);
  });
  it("is false for community/payment types", () => {
    expect(isSelfAccountType("JOIN_REQUEST_CREATED")).toBe(false);
  });
});

describe("notificationVisual", () => {
  it("returns the icon/color pair for a known type", () => {
    const v = notificationVisual("PAYMENT_RECEIVED");
    expect(v).not.toBeNull();
    expect(v.fg).toBe("#059669");
  });
  it("returns null for an unknown type", () => {
    expect(notificationVisual("SOMETHING_MADE_UP")).toBeNull();
  });
});

describe("notificationCategory", () => {
  it("buckets an urgent type correctly", () => {
    expect(notificationCategory("PAYMENT_FAILED")).toBe("urgent");
  });
  it("buckets a routine payment type as 'payment'", () => {
    expect(notificationCategory("PAYMENT_RECEIVED")).toBe("payment");
  });
  it("buckets a membership type as 'member'", () => {
    expect(notificationCategory("JOIN_REQUEST_CREATED")).toBe("member");
  });
  it("returns null (not a guessed fallback) for an unknown type", () => {
    expect(notificationCategory("SOMETHING_MADE_UP")).toBeNull();
  });
});

describe("notificationTypeTarget", () => {
  it("routes an admin join-request notification to the join-requests page", () => {
    expect(notificationTypeTarget("JOIN_REQUEST_CREATED")).toBe("/dashboard/join-requests");
  });

  it("appends the community ref to routes that take one (admin)", () => {
    expect(notificationTypeTarget("PAYMENT_DUE", { communityRef: "abc" })).toBe(
      "/dashboard/admin?community=abc",
    );
  });

  it("omits the query string when no community ref is known", () => {
    expect(notificationTypeTarget("PAYMENT_DUE")).toBe("/dashboard/admin");
  });

  it("routes the same type differently for the member app", () => {
    expect(notificationTypeTarget("JOIN_REQUEST_CREATED", { memberApp: true })).toBe(
      "/member/communities",
    );
  });

  it("returns null for GENERAL and for an unrecognized type", () => {
    expect(notificationTypeTarget("GENERAL")).toBeNull();
    expect(notificationTypeTarget("SOMETHING_MADE_UP")).toBeNull();
  });

  it("returns null for a member-app type with no member-side destination (e.g. SETTLEMENT_COMPLETED)", () => {
    expect(notificationTypeTarget("SETTLEMENT_COMPLETED", { memberApp: true })).toBeNull();
  });
});
