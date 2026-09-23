#!/usr/bin/env node
/**
 * Live idempotency probe for POST /payments/pay/payment-links/{id}.
 *
 * Fires the SAME idempotencyKey twice and reports whether the backend
 * returns one transaction or two. Does NOT open the Paystack URL and
 * does NOT complete checkout — no money should move. It does create
 * pending initialization records on the target environment.
 *
 * Usage:
 *   GLASSPAY_TOKEN=<accessToken> \
 *   GLASSPAY_PAYMENT_LINK=<paymentLinkId or slug> \
 *   node scripts/probe-payment-idempotency.mjs
 *
 * Get the token from the signed-in app: DevTools → Application →
 * Local Storage → accessToken (key name is "accessToken").
 *
 * Optional:
 *   GLASSPAY_API_BASE   default https://api.glasspay.app
 *   GLASSPAY_AMOUNT     default 100 (kobo/naira as required by the link)
 *   GLASSPAY_OBLIGATION optional obligation uuid
 */

const API_BASE = (process.env.GLASSPAY_API_BASE || "https://api.glasspay.app").replace(/\/$/, "");
const TOKEN = process.env.GLASSPAY_TOKEN;
const LINK = process.env.GLASSPAY_PAYMENT_LINK;
const AMOUNT = Number(process.env.GLASSPAY_AMOUNT ?? 100);
const OBLIGATION = process.env.GLASSPAY_OBLIGATION || undefined;
const KEY = `probe-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function fail(msg) {
  console.error(`\nFAIL: ${msg}\n`);
  process.exit(1);
}

if (!TOKEN) fail("Set GLASSPAY_TOKEN (localStorage accessToken from a signed-in session).");
if (!LINK) fail("Set GLASSPAY_PAYMENT_LINK (payment link id or slug to initialize against).");

async function postInit(idempotencyKey) {
  const body = {
    idempotencyKey,
    amount: AMOUNT,
    savePaymentMethod: false,
    ...(OBLIGATION ? { obligationId: OBLIGATION } : {}),
  };
  const res = await fetch(
    `${API_BASE}/api/v1/payments/pay/payment-links/${encodeURIComponent(LINK)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "User-Agent": UA,
      },
      body: JSON.stringify(body),
    },
  );
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, json };
}

function pickTx(res) {
  const d = res.json?.data ?? res.json ?? {};
  return {
    status: res.status,
    transactionId: d.transactionId ?? d.data?.transactionId ?? null,
    reference: d.reference ?? d.data?.reference ?? null,
    accessCode: d.accessCode ?? d.data?.accessCode ?? null,
    authorizationUrl: d.authorizationUrl ?? d.data?.authorizationUrl ?? null,
    message: res.json?.message ?? res.json?.description ?? null,
    success: res.json?.success ?? null,
  };
}

console.log(`API:     ${API_BASE}`);
console.log(`Link:    ${LINK}`);
console.log(`Amount:  ${AMOUNT}`);
console.log(`Key:     ${KEY}`);
console.log(`(no checkout — Paystack URL will not be opened)\n`);

// Control: omit key — expect 400 validation if schema.required is enforced
const noKey = await fetch(
  `${API_BASE}/api/v1/payments/pay/payment-links/${encodeURIComponent(LINK)}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${TOKEN}`,
      "User-Agent": UA,
    },
    body: JSON.stringify({ amount: AMOUNT, savePaymentMethod: false }),
  },
);
const noKeyBody = await noKey.text();
console.log(`Control (no idempotencyKey): HTTP ${noKey.status}`);
console.log(`  ${noKeyBody.slice(0, 240)}`);

const r1 = await postInit(KEY);
const t1 = pickTx(r1);
console.log(`\nAttempt 1: HTTP ${r1.status}`);
console.log(`  transactionId=${t1.transactionId} reference=${t1.reference}`);
console.log(`  accessCode=${t1.accessCode} success=${t1.success}`);

if (r1.status !== 200 || !t1.transactionId) {
  fail(
    `First init did not return a transaction (HTTP ${r1.status}). ` +
      `Fix token/link/amount before judging idempotency. body=${JSON.stringify(r1.json).slice(0, 300)}`,
  );
}

const r2 = await postInit(KEY);
const t2 = pickTx(r2);
console.log(`Attempt 2 (same key): HTTP ${r2.status}`);
console.log(`  transactionId=${t2.transactionId} reference=${t2.reference}`);
console.log(`  accessCode=${t2.accessCode} success=${t2.success}`);

const sameTx = t1.transactionId && t1.transactionId === t2.transactionId;
const sameRef = t1.reference && t1.reference === t2.reference;
const sameAccess = t1.accessCode && t1.accessCode === t2.accessCode;
const conflict = r2.status === 409 || /idempoten|duplicate|already/i.test(JSON.stringify(r2.json));

console.log("\n── Verdict ──");
if (sameTx || sameRef || sameAccess) {
  console.log("PASS: same idempotencyKey returned the original transaction (no second init).");
  console.log(`  matched: transactionId=${sameTx} reference=${sameRef} accessCode=${sameAccess}`);
  process.exit(0);
}
if (conflict) {
  console.log(
    "PASS (conflict style): second call rejected as duplicate rather than creating a new transaction.",
  );
  console.log(`  body: ${JSON.stringify(r2.json).slice(0, 300)}`);
  process.exit(0);
}
if (t2.transactionId && t2.transactionId !== t1.transactionId) {
  console.log("FAIL: same key produced a DIFFERENT transactionId — backend is not deduping.");
  console.log(`  first:  ${t1.transactionId} / ${t1.reference}`);
  console.log(`  second: ${t2.transactionId} / ${t2.reference}`);
  process.exit(2);
}
console.log("INCONCLUSIVE: could not compare transactions.");
console.log(`  first:  ${JSON.stringify(t1)}`);
console.log(`  second: ${JSON.stringify(t2)}`);
process.exit(3);
