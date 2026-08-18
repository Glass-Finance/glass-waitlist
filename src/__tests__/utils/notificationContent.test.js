import { describe, it, expect } from "vitest";
import { resolveNotificationBody } from "../../utils/notificationContent";

describe("resolveNotificationBody", () => {
  it("replaces the raw text with a name-first sentence for JOIN_REQUEST_CREATED when a name resolved", () => {
    const n = { notificationType: "JOIN_REQUEST_CREATED" };
    const details = { memberName: "Jane Doe", communityName: "Rotary Club" };
    expect(resolveNotificationBody(n, details, "jane@example.com requested to join")).toBe(
      "Jane Doe requested to join Rotary Club.",
    );
  });

  it("falls back to 'your community' when no community name resolved", () => {
    const n = { notificationType: "JOIN_REQUEST_CREATED" };
    const details = { memberName: "Jane Doe", communityName: null };
    expect(resolveNotificationBody(n, details, "raw text")).toBe(
      "Jane Doe requested to join your community.",
    );
  });

  it("keeps the raw text when no name resolved at all (nothing to prefer)", () => {
    const n = { notificationType: "JOIN_REQUEST_CREATED" };
    const details = { memberName: null, communityName: "Rotary Club" };
    expect(resolveNotificationBody(n, details, "jane@example.com requested to join")).toBe(
      "jane@example.com requested to join",
    );
  });

  it("passes the raw text through unchanged for notification types with no override template", () => {
    const n = { notificationType: "PAYMENT_RECEIVED" };
    const details = { memberName: "Jane Doe", communityName: "Rotary Club" };
    expect(resolveNotificationBody(n, details, "Jane Doe paid ₦5,000")).toBe(
      "Jane Doe paid ₦5,000",
    );
  });

  it("reads notificationType from either `notificationType` or `type`", () => {
    const n = { type: "JOIN_REQUEST_CREATED" };
    const details = { memberName: "Jane Doe", communityName: "Rotary Club" };
    expect(resolveNotificationBody(n, details, "raw")).toBe(
      "Jane Doe requested to join Rotary Club.",
    );
  });
});
