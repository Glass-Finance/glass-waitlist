// Extracts the structured facts (member, community, amount, plan, time,
// transaction reference) out of a notification.
//
// Confirmed against the real NotificationDto schema (backend Swagger):
// id, userId, communityId, title, message, bodyText, notificationType,
// channel, status, device, content (free-form, "additional properties:
// any"), relatedEntityType, relatedEntityId, readFlag, readAt, createdAt.
// That's it -- there is no nested member/actor/payer/user/requestedUser
// object, no `community` object (only the bare `communityId` uuid), no
// `transaction` object, no `paymentLink`/`planName` field. Everything
// this file used to probe on those never-existing shapes was a guess that
// could never have matched real data. Only two sources are real:
//   1. `content` — whatever the backend author chose to attach, entirely
//      optional and unconfirmed per-field.
//   2. `title` / `message` / `bodyText` — the human-readable text, which
//      in practice reliably spells out the same facts ("Jane Doe paid
//      ₦5,000 for Monthly Dues. Ref: TXN-…") since content isn't always
//      populated.
// Every extractor returns null when it can't find a confident value;
// callers should render only the rows that resolved.

function textOf(n) {
  return `${n.title ?? ""} ${n.message ?? n.bodyText ?? ""}`;
}

// Message body only, no title — parseMemberName's word-sequence match has
// no capitalisation requirement (real names here are often lowercase), so
// without this it would happily swallow generic title boilerplate like
// "Payment received" as part of the "name" right up to the verb, since
// nothing stops the greedy match at the title/message boundary.
function messageOnly(n) {
  return n.message ?? n.bodyText ?? "";
}

// Names can arrive in any case depending on the source (a structured field
// echoing exactly what the user typed at signup, or a regex match) — title
// case them consistently for display, same convention as Join Requests.
function capitalizeName(s) {
  return (s ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
}

// "₦5,000", "NGN 5000", "₦ 12,500.50"
function parseAmount(text) {
  const m = text.match(/(?:₦|NGN)\s?([\d,]+(?:\.\d{1,2})?)/i);
  if (!m) return null;
  const value = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

// A name directly before an action verb ("Jane Doe paid…", "home alone
// paid…", "John Okafor joined…"), or after "from"/"by". Requires at least
// two space-separated word-tokens starting with a letter — that's enough to
// reject a bare email (one token, no space) without also requiring
// capitalisation, which real names in this app often lack: users type their
// own name at signup in whatever case they feel like ("home alone" is a
// real, confirmed user, not a placeholder) and the backend's message
// template embeds it verbatim. capitalizeName() normalises the case after.
function parseMemberName(text) {
  const name = "([A-Za-z][\\w'’-]*(?:\\s+[A-Za-z][\\w'’-]*)+)";
  const m =
    text.match(new RegExp(`${name}\\s+(?:has\\s+)?(?:paid|made|sent|joined|requested|completed|missed)`, "i")) ??
    text.match(new RegExp(`(?:from|by)\\s+${name}`, "i"));
  return m?.[1] ?? null;
}

// Plan title in quotes, or between "for (the)" and "plan/dues/payment".
function parsePlanName(text) {
  const quoted = text.match(/["“']([^"“”']{3,60})["”']/);
  if (quoted) return quoted[1];
  const m = text.match(/\bfor\s+(?:the\s+)?([A-Z][\w\s&-]{2,50}?)\s*(?:plan|dues|payment|subscription)\b/i);
  return m?.[1]?.trim() ?? null;
}

// "Ref: TXN-88213", "reference GL_a1b2c3", or a bare TXN-prefixed token.
function parseReference(text) {
  const m =
    text.match(/\bref(?:erence)?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9_-]{5,})/i) ??
    text.match(/\b(TXN[-_][A-Za-z0-9_-]{4,})\b/i);
  return m?.[1] ?? null;
}

// Last-resort match: the notification's own text almost always names the
// community in plain language ("...requested to join Rotary Club.", "...
// paid ₦10,000 for Community Anniversary in Rotary Club") even when
// communityId doesn't resolve against the caller's own communities list
// (e.g. it's a community they administer but the list used to build the
// map doesn't happen to include, or the id is missing on this particular
// event). Matches against the admin's own communities list by name
// (case-insensitive substring), preferring the longest name that actually
// appears so a short generic name doesn't win over a more specific one
// contained in the same text.
export function resolveCommunityByName(text, communityMap) {
  if (!communityMap || typeof communityMap.values !== "function") return null;
  const lower = text.toLowerCase();
  const seen = new Set();
  let best = null;
  for (const c of communityMap.values()) {
    const key = c?.id ?? c?.slug ?? c?.name;
    if (!c?.name || !key || seen.has(key)) continue;
    seen.add(key);
    if (lower.includes(c.name.toLowerCase()) && (!best || c.name.length > best.name.length)) {
      best = c;
    }
  }
  return best;
}

// Resolves a community's display name/logo from communityId (the only
// community-related field the real schema has) against the caller's own
// communities list, falling back to text matching when the id doesn't
// resolve. Exported so every caller shares one implementation instead of
// maintaining a separate copy — NotificationsPanel.jsx (the bell dropdown)
// used to keep its own local version that had quietly drifted from this
// one, which is exactly the kind of gap that made the two surfaces behave
// differently for the same notification.
export function resolveCommunity(n, communityMap) {
  if (n.communityId && communityMap) {
    const hit = communityMap.get?.(n.communityId) ?? communityMap[n.communityId];
    if (hit) return hit;
  }
  return resolveCommunityByName(textOf(n), communityMap);
}

function resolveCommunityName(n, communityMap) {
  return resolveCommunity(n, communityMap)?.name ?? null;
}

function resolveCommunityLogo(n, communityMap) {
  return resolveCommunity(n, communityMap)?.logo?.url ?? null;
}

export function extractNotificationDetails(n, { communityMap } = {}) {
  const text = textOf(n);
  const content = n.content && typeof n.content === "object" ? n.content : {};

  // A structured firstName-only field in `content` (no lastName attached)
  // used to win outright over the message text's fuller name, cutting a
  // real two-word name like "home alone" down to one letter of initials
  // ("H") even though the text spells the whole name out right there.
  // Compares word counts and takes whichever is actually more complete.
  const rawMemberName = (() => {
    const first = content.firstName ?? content.first_name;
    const last = content.lastName ?? content.last_name;
    const structured =
      (first || last)
        ? `${first ?? ""} ${last ?? ""}`.trim()
        : (content.memberName ?? content.actorName ?? content.payerName ?? content.fullName ?? content.name ?? null);
    const parsed = parseMemberName(messageOnly(n));
    const wordCount = (s) => (s ?? "").trim().split(/\s+/).filter(Boolean).length;
    return wordCount(parsed) > wordCount(structured) ? parsed : (structured ?? parsed);
  })();

  // content is genuinely the only place a photo URL could live -- there's
  // no member/actor/user sub-object on the real schema to probe. Real
  // notification payloads are unlikely to carry this at all (it's a
  // lightweight event record, not a full user snapshot), so this resolves
  // to null far more often than not -- the initials fallback in the avatar
  // components is the realistic common case, not this.
  const memberPhoto = content.profileImage?.url ?? content.profileImageUrl ?? content.avatarUrl ?? content.photoUrl ?? null;

  return {
    memberName: rawMemberName ? capitalizeName(rawMemberName) : null,
    memberPhoto,
    communityName: content.communityName ?? resolveCommunityName(n, communityMap),
    communityLogo: content.communityLogo?.url ?? resolveCommunityLogo(n, communityMap),
    // Confirmed against real payloads: some notifications carry `amount` in
    // major units (naira), others only `amountMinor` in minor units (kobo —
    // Paystack convention, ÷100 to get naira). Neither is universal, so both
    // are checked.
    amount:
      content.amount ?? content.paymentAmount ??
      (content.amountMinor != null ? content.amountMinor / 100 : null) ??
      parseAmount(text),
    // paymentLinkTitle is the confirmed field name — planTitle/planName
    // were guesses that never matched anything.
    planName:
      content.paymentLinkTitle ?? content.planTitle ?? content.paymentPlanTitle ?? content.planName ??
      parsePlanName(text),
    // A human-readable `reference` string only shows up on some
    // transactions; when it's missing, relatedEntityId (a real field —
    // matches the notification's own relatedEntityType) is still a
    // genuine, traceable reference for Transaction-typed notifications —
    // better than showing nothing.
    reference:
      content.reference ?? content.transactionReference ?? content.transactionId ??
      (n.relatedEntityType === "Transaction" ? n.relatedEntityId : null) ??
      parseReference(text),
    time: n.createdAt ?? null,
  };
}

export function formatNairaAmount(amount) {
  if (amount == null) return null;
  return "₦" + new Intl.NumberFormat("en-NG").format(amount);
}

// Shared avatar-fallback initials -- a photo/logo is preferred, but a
// notification avatar should never render as a flat empty circle. Up to
// two initials, from the first two space-separated words (so "Home Alone"
// → "HA", "Rotary Club" → "RC"), used identically by the bell dropdown,
// admin notifications page, and member app notifications page instead of
// each inventing its own.
export function initials(name) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// Builds a Map(id → community) from a flat communities list (the shape
// useMyCommunities()/getMyCommunities() return), for extractNotificationDetails'
// communityMap option.
export function buildCommunityMap(communities) {
  const map = new Map();
  for (const c of communities ?? []) {
    const community = c.community ?? c; // some list endpoints nest under .community
    if (community?.id) map.set(community.id, community);
    if (community?.slug) map.set(community.slug, community);
  }
  return map;
}
