import { describe, it, expect } from "vitest";
import {
  shapeObligation,
  shapePaymentLink,
  shapeTransaction,
  shapeAuthorisation,
  normalizeCommunity,
} from "../../../hooks/payments/shape";

describe("shapeObligation", () => {
  it("maps the common fields through from the raw response", () => {
    const raw = {
      id: "ob-1",
      amount: 5000,
      amountPaid: 0,
      dueAt: "2026-08-15",
      status: "PENDING",
      paymentLink: { id: "pl-1", title: "Alumni Dues", status: "ACTIVE" },
      community: { name: "Alumni Assoc", slug: "alumni", logo: { url: "x" } },
    };
    const shaped = shapeObligation(raw);
    expect(shaped).toMatchObject({
      id: "ob-1",
      obligationId: "ob-1",
      amount: 5000,
      name: "Alumni Dues",
      dueDate: "2026-08-15",
      status: "PENDING",
      paymentLinkId: "pl-1",
      linkStatus: "ACTIVE",
      communityName: "Alumni Assoc",
      communitySlug: "alumni",
    });
  });

  it("falls back to description then 'Payment' when the link has no title", () => {
    expect(shapeObligation({ description: "Custom fee" }).name).toBe("Custom fee");
    expect(shapeObligation({}).name).toBe("Payment");
  });

  it("normalizes a SUCCESSFUL status to PAID", () => {
    expect(shapeObligation({ status: "SUCCESSFUL" }).status).toBe("PAID");
  });

  it("defaults a missing status to PENDING", () => {
    expect(shapeObligation({}).status).toBe("PENDING");
  });

  it("detects a recurring plan via the recurringPlan field", () => {
    expect(shapeObligation({ recurringPlan: { id: "p1" } }).type).toBe("recurring");
  });

  it("detects a recurring plan via paymentLink.paymentType", () => {
    expect(
      shapeObligation({ paymentLink: { paymentType: "RECURRING" } }).type,
    ).toBe("recurring");
  });

  it("defaults to one-time when neither recurring signal is present", () => {
    expect(shapeObligation({}).type).toBe("one-time");
  });

  it("derives logoText from the community's first letter, uppercased", () => {
    expect(shapeObligation({ community: { name: "zenith club" } }).logoText).toBe("Z");
  });

  it("defaults logoText to 'C' when there is no community name", () => {
    expect(shapeObligation({}).logoText).toBe("C");
  });
});

describe("shapePaymentLink", () => {
  it("maps title, amount, and id through", () => {
    const raw = { id: "pl-1", title: "Building Fund", amount: 20000, status: "ACTIVE" };
    const shaped = shapePaymentLink(raw);
    expect(shaped).toMatchObject({
      id: "pl-1",
      paymentLinkId: "pl-1",
      name: "Building Fund",
      amount: 20000,
      linkStatus: "ACTIVE",
      amountPaid: 0,
      status: "PENDING",
      obligationId: null,
      _isLink: true,
    });
  });

  it("falls back to the caller-supplied community slug when the link has none", () => {
    expect(shapePaymentLink({}, "fallback-slug").communitySlug).toBe("fallback-slug");
  });

  it("prefers the link's own community slug over the fallback", () => {
    const raw = { community: { slug: "real-slug" } };
    expect(shapePaymentLink(raw, "fallback-slug").communitySlug).toBe("real-slug");
  });

  it("detects recurring via paymentType or recurringPlan", () => {
    expect(shapePaymentLink({ paymentType: "RECURRING" }).type).toBe("recurring");
    expect(shapePaymentLink({ recurringPlan: {} }).type).toBe("recurring");
    expect(shapePaymentLink({}).type).toBe("one-time");
  });

  it("falls back through the frequency field chain", () => {
    expect(shapePaymentLink({ recurringPlan: { frequency: "WEEKLY" } }).frequency).toBe("WEEKLY");
    expect(shapePaymentLink({ frequency: "MONTHLY" }).frequency).toBe("MONTHLY");
    expect(shapePaymentLink({ billingFrequency: "YEARLY" }).frequency).toBe("YEARLY");
    expect(shapePaymentLink({}).frequency).toBe(null);
  });
});

describe("shapeTransaction", () => {
  it("normalizes a SUCCESSFUL status to lowercase 'success'", () => {
    expect(shapeTransaction({ status: "SUCCESSFUL" }).status).toBe("success");
  });

  it("lowercases other statuses without renaming them", () => {
    expect(shapeTransaction({ status: "FAILED" }).status).toBe("failed");
  });

  it("falls back from paidAt to createdAt for the date", () => {
    expect(shapeTransaction({ createdAt: "2026-01-01" }).date).toBe("2026-01-01");
    expect(shapeTransaction({ paidAt: "2026-02-02", createdAt: "2026-01-01" }).date).toBe(
      "2026-02-02",
    );
  });

  it("maps internalReference to reference", () => {
    expect(shapeTransaction({ internalReference: "ref-123" }).reference).toBe("ref-123");
  });

  it("defaults currency to NGN", () => {
    expect(shapeTransaction({}).currency).toBe("NGN");
  });
});

describe("shapeAuthorisation", () => {
  it("defaults last4 to '****' when missing", () => {
    expect(shapeAuthorisation({}).last4).toBe("****");
  });

  it("falls back to snake_case exp fields when camelCase is absent", () => {
    const raw = { exp_month: 12, exp_year: 2030 };
    const shaped = shapeAuthorisation(raw);
    expect(shaped.expMonth).toBe(12);
    expect(shaped.expYear).toBe(2030);
  });

  it("maps consents and derives revoked from revokedAt", () => {
    const raw = {
      consents: [
        { consentId: "c1", community: { name: "Club" }, paymentLink: { id: "pl-1", title: "Dues" } },
        { consentId: "c2", revokedAt: "2026-01-01" },
      ],
    };
    const shaped = shapeAuthorisation(raw);
    expect(shaped.consents).toEqual([
      { id: "c1", planStatus: undefined, communityName: "Club", paymentLinkTitle: "Dues", paymentLinkId: "pl-1", revoked: false },
      { id: "c2", planStatus: undefined, communityName: undefined, paymentLinkTitle: undefined, paymentLinkId: null, revoked: true },
    ]);
  });

  it("defaults consents to an empty array when absent", () => {
    expect(shapeAuthorisation({}).consents).toEqual([]);
  });
});

describe("normalizeCommunity", () => {
  it("returns null unchanged", () => {
    expect(normalizeCommunity(null)).toBe(null);
  });

  it("leaves an owner/admin-shaped record (already top-level) unchanged", () => {
    const c = { name: "Alumni", slug: "alumni", logo: { url: "x" } };
    expect(normalizeCommunity(c)).toMatchObject({ name: "Alumni", slug: "alumni" });
  });

  it("lifts name/slug/logo up from a nested member-shaped .community object", () => {
    const c = { community: { name: "Alumni", slug: "alumni", logo: { url: "x" } }, memberRole: "MEMBER" };
    const normalized = normalizeCommunity(c);
    expect(normalized.name).toBe("Alumni");
    expect(normalized.slug).toBe("alumni");
    expect(normalized.logo).toEqual({ url: "x" });
  });

  it("prefers top-level fields over nested ones when both exist", () => {
    const c = { name: "Top", community: { name: "Nested" } };
    expect(normalizeCommunity(c).name).toBe("Top");
  });
});
