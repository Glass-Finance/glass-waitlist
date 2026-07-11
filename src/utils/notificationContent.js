// Extracts the structured facts (#21: member, community, amount, plan, time,
// transaction details) out of a notification. The backend payload today only
// guarantees title/message/community/createdAt, so this works in two layers:
//
//   1. Probe for structured fields under the names the backend is likely to
//      use — if the payload gains real fields later, they win automatically.
//   2. Fall back to parsing the human-readable text, where the same facts are
//      usually embedded ("Jane Doe paid ₦5,000 for Monthly Dues. Ref: TXN-…").
//
// Every extractor returns null when it can't find a confident value; callers
// should render only the rows that resolved.

function textOf(n) {
  return `${n.title ?? n.subject ?? ""} ${n.description ?? n.message ?? n.body ?? ""}`;
}

// "₦5,000", "NGN 5000", "₦ 12,500.50"
function parseAmount(text) {
  const m = text.match(/(?:₦|NGN)\s?([\d,]+(?:\.\d{1,2})?)/i);
  if (!m) return null;
  const value = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

// A capitalised full name directly before an action verb ("Jane Doe paid…",
// "John Okafor joined…"), or after "from"/"by". Requires at least two name
// words so single capitalised words like "Payment" never match.
function parseMemberName(text) {
  const name = "([A-Z][\\w'’-]+(?:\\s+[A-Z][\\w'’-]+)+)";
  const m =
    text.match(new RegExp(`${name}\\s+(?:has\\s+)?(?:paid|made|sent|joined|requested|completed|missed)`)) ??
    text.match(new RegExp(`(?:from|by)\\s+${name}`));
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

export function extractNotificationDetails(n) {
  const text = textOf(n);
  return {
    memberName:
      n.memberName ?? n.member?.name ?? n.actorName ?? n.actor?.name ??
      parseMemberName(text),
    communityName: n.communityName ?? n.community?.name ?? null,
    amount: n.amount ?? n.paymentAmount ?? n.transaction?.amount ?? parseAmount(text),
    planName:
      n.paymentLink?.title ?? n.planName ?? n.paymentPlan?.title ??
      parsePlanName(text),
    reference:
      n.reference ?? n.transactionReference ?? n.transaction?.internalReference ??
      n.transaction?.reference ?? parseReference(text),
    time: n.createdAt ?? n.timestamp ?? null,
  };
}

export function formatNairaAmount(amount) {
  if (amount == null) return null;
  return "₦" + new Intl.NumberFormat("en-NG").format(amount);
}
