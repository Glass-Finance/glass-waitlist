import { describe, it, expect } from "vitest";
import {
  shapeTransaction,
  shapeObligation,
  shapePaymentLink,
  normalizeCommunity,
} from "../../hooks/payments/shape";
import { requesterOf } from "../../hooks/useJoinRequests";
import { extractNotificationDetails } from "../../utils/notificationContent";
import { withSafeCommunityLogos } from "../../pages/dashboard/platform-admin/shared";

// Every shared boundary the audit identified, tested directly. Each one is the
// single point through which many <img src> sinks read their value, so the
// contract asserted here — "a server-supplied javascript: URL becomes null, and
// legitimate URLs survive untouched" — is what makes those sinks safe without
// any JSX-level validation.

const EVIL = "javascript:alert(document.domain)";
const GOOD = "https://res.cloudinary.com/demo/image/upload/logo.png";

describe("shape.js transaction/obligation boundaries", () => {
  it("normalizes an unsafe community logo to null on a transaction", () => {
    const tx = shapeTransaction({ id: 1, community: { logo: { url: EVIL, fileId: 9 } } });

    expect(tx.communityLogo.url).toBeNull();
    expect(tx.communityLogo.fileId).toBe(9); // unrelated fields preserved
  });

  it("preserves a valid community logo on a transaction", () => {
    const tx = shapeTransaction({ id: 1, community: { logo: { url: GOOD } } });

    expect(tx.communityLogo.url).toBe(GOOD);
  });

  it("normalizes an unsafe community logo on an obligation", () => {
    expect(shapeObligation({ id: 1, community: { logo: { url: EVIL } } }).logo.url).toBeNull();
    expect(shapeObligation({ id: 1, community: { logo: { url: GOOD } } }).logo.url).toBe(GOOD);
  });

  it("normalizes an unsafe community logo on a payment link", () => {
    expect(shapePaymentLink({ id: 1, community: { logo: { url: EVIL } } }).logo.url).toBeNull();
    expect(shapePaymentLink({ id: 1, community: { logo: { url: GOOD } } }).logo.url).toBe(GOOD);
  });

  it("normalizes a community logo nested under `community` via normalizeCommunity", () => {
    // normalizeCommunity lifts the logo to the top level for the member-role
    // list shape, so it is a second route into the same sink.
    expect(normalizeCommunity({ community: { logo: { url: EVIL } } }).logo.url).toBeNull();
    expect(normalizeCommunity({ community: { logo: { url: GOOD } } }).logo.url).toBe(GOOD);
  });

  it("leaves a community with no logo alone", () => {
    expect(shapeTransaction({ id: 1, community: { name: "X" } }).communityLogo).toBeUndefined();
  });
});

describe("useJoinRequests.requesterOf boundary", () => {
  it("rejects an unsafe requester image from the userData object shape", () => {
    // ud.profileImage arrives as a { url } object on the /user/me-derived payload.
    const r = requesterOf({ requestedUser: { userData: { profileImage: { url: EVIL } } } });
    expect(r.image).toBeNull();
  });

  it("rejects an unsafe requester image from the plain-string shapes", () => {
    expect(requesterOf({ requestedUser: { profileImage: { url: EVIL } } }).image).toBeNull();
    expect(requesterOf({ requestedUser: { avatarUrl: EVIL } }).image).toBeNull();
  });

  it("preserves a valid requester image", () => {
    const r = requesterOf({ requestedUser: { avatarUrl: GOOD } });
    expect(r.image).toBe(GOOD);
  });

  it("still falls back to a derived name and initials", () => {
    const r = requesterOf({ requestedUser: { firstName: "ada", avatarUrl: EVIL } });

    expect(r.image).toBeNull();
    expect(r.name).toBe("Ada");
    expect(r.initials).toBe("A");
  });
});

describe("notificationContent.extractNotificationDetails boundary", () => {
  it("rejects an unsafe member photo across all four field spellings", () => {
    for (const content of [
      { profileImage: { url: EVIL } },
      { profileImageUrl: EVIL },
      { avatarUrl: EVIL },
      { photoUrl: EVIL },
    ]) {
      const details = extractNotificationDetails({ content });
      expect(details.memberPhoto).toBeNull();
    }
  });

  it("preserves a valid member photo", () => {
    const details = extractNotificationDetails({ content: { avatarUrl: GOOD } });
    expect(details.memberPhoto).toBe(GOOD);
  });

  it("rejects an unsafe community logo carried on the notification", () => {
    const details = extractNotificationDetails({ content: { communityLogo: { url: EVIL } } });
    expect(details.communityLogo).toBeNull();
  });

  it("rejects an unsafe community logo resolved through the community map", () => {
    // The map is built from the user's communities; a poisoned entry must not
    // survive the fallback lookup either.
    const communityMap = new Map([["c1", { id: "c1", logo: { url: EVIL } }]]);
    const details = extractNotificationDetails(
      { content: { communityId: "c1" } },
      { communityMap },
    );
    expect(details.communityLogo).toBeNull();
  });

  it("preserves a valid community logo resolved through the community map", () => {
    const communityMap = new Map([["c1", { id: "c1", logo: { url: GOOD } }]]);
    const details = extractNotificationDetails(
      { content: { communityId: "c1" } },
      { communityMap },
    );
    expect(details.communityLogo).toBe(GOOD);
  });
});

describe("platform-admin withSafeCommunityLogos boundary", () => {
  it("nulls an unsafe logo and preserves the rest of the page envelope", () => {
    const page = {
      content: [{ id: 1, name: "A", logo: { url: EVIL }, memberRole: "OWNER" }],
      totalElements: 1,
      totalPages: 1,
    };
    const result = withSafeCommunityLogos(page);

    expect(result.content[0].logo.url).toBeNull();
    expect(result.content[0].memberRole).toBe("OWNER");
    expect(result.totalElements).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("preserves a valid logo", () => {
    const page = { content: [{ id: 1, logo: { url: GOOD } }], totalElements: 1, totalPages: 1 };
    expect(withSafeCommunityLogos(page).content[0].logo.url).toBe(GOOD);
  });

  it("passes through an empty or absent page unchanged", () => {
    expect(withSafeCommunityLogos({ content: [], totalElements: 0 })).toEqual({
      content: [],
      totalElements: 0,
    });
    expect(withSafeCommunityLogos(undefined)).toBeUndefined();
  });
});
