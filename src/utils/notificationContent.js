// Extracts the structured facts (#21: member, community, amount, plan, time,
// transaction details) out of a notification. Three layers, most confident
// first:
//
//   1. `content` — a free-form object the backend can attach per
//      NotificationDto.content (documented as "additional properties: any").
//      Probed under the field names the backend is likely to use.
//   2. `communityId` resolved against the caller's own communities list
//      (NotificationDto only carries the raw id, never a name/logo).
//   3. Fall back to parsing the human-readable text, where the same facts
//      are usually embedded ("Jane Doe paid ₦5,000 for Monthly Dues. Ref:
//      TXN-…").
//
// Every extractor returns null when it can't find a confident value; callers
// should render only the rows that resolved.

function textOf(n) {
  return `${n.title ?? n.subject ?? ""} ${n.message ?? n.description ?? n.bodyText ?? n.body ?? ""}`;
}

// Message body only, no title — parseMemberName's word-sequence match has
// no capitalisation requirement (real names here are often lowercase), so
// without this it would happily swallow generic title boilerplate like
// "Payment received" as part of the "name" right up to the verb, since
// nothing stops the greedy match at the title/message boundary.
function messageOnly(n) {
  return n.message ?? n.description ?? n.bodyText ?? n.body ?? "";
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

// Best-effort resolution of a community's display name from just its id —
// the raw notification only ever carries `communityId` (a uuid), never a
// name or logo. `communityMap` is a Map/lookup keyed by id (and ideally
// slug) built from the caller's own communities list; callers that already
// resolved a community object (e.g. the topbar panel) can pass it via
// communityOverride instead of rebuilding the map.
function resolveCommunity(n, communityMap) {
  const id = n.communityId ?? n.community?.id ?? null;
  if (!id || !communityMap) return null;
  return communityMap.get?.(id) ?? communityMap[id] ?? null;
}

function resolveCommunityName(n, communityMap) {
  return resolveCommunity(n, communityMap)?.name ?? null;
}

function resolveCommunityLogo(n, communityMap) {
  const c = resolveCommunity(n, communityMap);
  return c?.logo?.url ?? c?.logoUrl ?? n.community?.logo?.url ?? null;
}

export function extractNotificationDetails(n, { communityMap } = {}) {
  const text = textOf(n);
  const content = n.content && typeof n.content === "object" ? n.content : {};

  // Broad, best-effort probe across the field names the backend is most
  // likely to use for "who this notification is about" — a first/last
  // pair takes priority over any single combined-name field, and a nested
  // user/member/actor/payer object is checked the same way.
  const memberCandidates = [content, n, n.member, n.actor, n.payer, n.user, n.requestedUser];

  const rawMemberName = (() => {
    for (const c of memberCandidates) {
      if (!c || typeof c !== "object") continue;
      const first = c.firstName ?? c.first_name;
      const last = c.lastName ?? c.last_name;
      if (first || last) return `${first ?? ""} ${last ?? ""}`.trim();
      const combined =
        c.memberName ?? c.actorName ?? c.userName ?? c.payerName ?? c.fullName ?? c.name;
      if (combined) return combined;
    }
    return parseMemberName(messageOnly(n));
  })();

  // Same nested candidate objects as the name above -- profileImage is the
  // confirmed shape elsewhere in the app (Sidebar/Topbar/Profile pages all
  // read user.profileImage.url), so probed the same way rather than a new
  // guess. Returns null (not rendered) when the payload doesn't carry it,
  // same defensive rule as every other field here.
  const memberPhoto = (() => {
    for (const c of memberCandidates) {
      if (!c || typeof c !== "object") continue;
      const url = c.profileImage?.url ?? c.profileImageUrl ?? c.avatarUrl ?? c.photoUrl;
      if (url) return url;
    }
    return null;
  })();

  return {
    memberName: rawMemberName ? capitalizeName(rawMemberName) : null,
    memberPhoto,
    communityName:
      content.communityName ?? n.communityName ?? n.community?.name ??
      resolveCommunityName(n, communityMap),
    communityLogo:
      content.communityLogo?.url ?? n.community?.logo?.url ??
      resolveCommunityLogo(n, communityMap),
    // Confirmed against real payloads: some notifications carry `amount` in
    // major units (naira), others only `amountMinor` in minor units (kobo —
    // Paystack convention, ÷100 to get naira). Neither is universal, so both
    // are checked.
    amount:
      content.amount ?? content.paymentAmount ??
      (content.amountMinor != null ? content.amountMinor / 100 : null) ??
      n.amount ?? n.paymentAmount ?? n.transaction?.amount ??
      parseAmount(text),
    // paymentLinkTitle is the confirmed field name — planTitle/planName
    // were guesses that never matched anything.
    planName:
      content.paymentLinkTitle ?? content.planTitle ?? content.paymentPlanTitle ?? content.planName ??
      n.paymentLink?.title ?? n.planName ?? n.paymentPlan?.title ??
      parsePlanName(text),
    // A human-readable `reference` string only shows up on some
    // transactions; when it's missing, the internal transactionId (which
    // matches the notification's own relatedEntityId for Transaction-typed
    // notifications) is still a genuine, traceable reference — better than
    // showing nothing.
    reference:
      content.reference ?? content.transactionReference ??
      n.reference ?? n.transactionReference ?? n.transaction?.internalReference ??
      n.transaction?.reference ??
      content.transactionId ??
      (n.relatedEntityType === "Transaction" ? n.relatedEntityId : null) ??
      parseReference(text),
    time: n.createdAt ?? n.timestamp ?? null,
  };
}

export function formatNairaAmount(amount) {
  if (amount == null) return null;
  return "₦" + new Intl.NumberFormat("en-NG").format(amount);
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
