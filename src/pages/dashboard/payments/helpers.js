import { FREQUENCY_UNIT_LABEL, WEEKDAYS } from "./constants";
import { ordinal } from "../../../utils/recurring";

export { ordinal };

export function intervalUnitLabel(frequency, interval) {
  const unit = FREQUENCY_UNIT_LABEL[frequency] ?? "cycle";
  const n = Number(interval);
  return n === 1 ? unit : `${unit}s`;
}

// Human-readable billing day for review rows ("Monday" / "The 5th").
export function billingDayLabel(frequency, billingDay) {
  const day = Number(billingDay);
  if (!day) return "—";
  return frequency === "WEEKLY" ? (WEEKDAYS[day - 1] ?? String(day)) : `The ${ordinal(day)}`;
}

// <input type="number"> silently increments/decrements its value on
// mouse-wheel scroll while it has focus — a well-known browser footgun that
// bites hardest inside a scrollable form like these plan modals: scroll
// past a still-focused Amount/interval field and its value quietly shifts
// by the scroll delta with no visual feedback. Blurring on wheel makes the
// scroll just scroll the page instead, like every other input on the page.
export function blurOnWheel(e) {
  e.currentTarget.blur();
}

export function formatCompact(amount) {
  return new Intl.NumberFormat("en-NG", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount ?? 0);
}

export function toDateInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function payoutAccountLabel(account) {
  if (!account) return "Unnamed account";
  const bank = account.settlementBank ?? account.bank ?? "Bank";
  const last4 = (account.accountNumber ?? "").slice(-4);
  return last4 ? `${bank} — ••••${last4}` : bank;
}

// Shared by CreatePlanModal and EditPlanModal — both collect the same
// name/amount pair and neither validated anything beyond "is it truthy"
// before, which let a 0 or negative amount (still "truthy" as a non-empty
// string) through to the backend instead of catching it inline.
export function validatePlanField(field, value) {
  if (field === "name" && !String(value ?? "").trim()) return "Plan name is required.";
  if (field === "amount") {
    if (!String(value ?? "").trim()) return "Amount is required.";
    if (!(Number(value) > 0)) return "Enter an amount greater than 0.";
  }
  return "";
}

// ── amountMode ──────────────────────────────────────────────────────────────
// Everything below is derived from the backend's
// CollectionPaymentSupport.validatePaymentTypeAmount, NOT from the request
// DTO — UpsertPaymentLinkRequest marks amountMode @NotNull but leaves amount
// un-annotated, which reads as "amount is always optional". The service is
// stricter, and the DTO is the weaker of the two sources:
//
//   1. paymentType x amountMode is a whitelist. RECURRING accepts FIXED and
//      nothing else; ONE_TIME accepts all four. Offering VARIABLE on a
//      recurring plan is a guaranteed 400 ("Amount mode is not allowed for
//      payment type").
//   2. amount is required (non-null, > 0) for FIXED, MINIMUM and SUGGESTED.
//      VARIABLE is exempt: the service maps a null amount to 0
//      (resolvedAmountMinor), so "no amount" is a real, supported state.
//   3. A server-configured collection minimum additionally applies to
//      FIXED/MINIMUM/SUGGESTED. That value lives in backend system config and
//      is deliberately not duplicated here — it surfaces as a 400 we render.

// The amount modes a given plan type may use. Takes the wizard's
// "recurring"/"one_time" vocabulary as well as the backend's enum names, so
// both the create wizard and the edit modal (which has RECURRING/ONE_TIME)
// can call it without translating first.
export function amountModesForPlanType(planType) {
  const isRecurring = planType === "recurring" || planType === "RECURRING" || planType === true;
  return isRecurring ? ["FIXED"] : ["FIXED", "MINIMUM", "SUGGESTED", "VARIABLE"];
}

// Clamp a chosen mode to what the plan type allows. The create wizard can
// reach a disallowed state by picking VARIABLE on a one-time plan, then going
// Back and switching to recurring — the payload must never carry it.
export function resolveAmountMode(planType, amountMode) {
  const allowed = amountModesForPlanType(planType);
  return allowed.includes(amountMode) ? amountMode : allowed[0];
}

export function amountRequiredForMode(amountMode) {
  return amountMode !== "VARIABLE";
}

/**
 * The form patch for an audience change.
 *
 * Each audience owns exactly one id list, and neither list may survive a switch
 * away from its audience. Without this, going SELECTED_MEMBERS → GROUP leaves
 * `memberIds` populated in state; the payload builder keys off the audience so
 * it wouldn't be transmitted, but the stale list would silently reappear the
 * moment the admin switched back — re-selecting people they had moved away
 * from, with no click to explain it.
 *
 * Both lists reset rather than carrying over: the incoming audience's list is
 * empty in practice (you only hold ids for the audience you're currently on),
 * and resetting is the only behaviour that can't be stale.
 *
 * Hydration is unaffected — this runs on a change event, so opening an existing
 * GROUP plan for edit never fires it.
 *
 * Shared rather than inlined in each modal so the two paths can't drift on which
 * list belongs to which audience, the same reason AudienceMemberPicker exists.
 *
 * @param {string} nextAudience the audience just chosen
 * @returns {{audience: string, memberIds: string[], groupIds: string[]}}
 */
export function audienceChangePatch(nextAudience) {
  return { audience: nextAudience, memberIds: [], groupIds: [] };
}

// Mode-aware replacement for the old unconditional amount rule. Kept separate
// from validatePlanField so the name/amount pair that both modals already
// share stays untouched.
export function validateAmountForMode(value, amountMode) {
  if (!amountRequiredForMode(amountMode)) {
    // Optional, but a value that IS typed still has to be sane: the backend
    // rejects a negative amount in every mode.
    if (String(value ?? "").trim() && !(Number(value) > 0)) {
      return "Enter an amount greater than 0.";
    }
    return "";
  }
  return validatePlanField("amount", value);
}

// The amount to put on the wire.
//
// VARIABLE with a blank field sends 0 rather than omitting `amount`. That is
// deliberate and load-bearing on the edit path: the backend's update handler
// substitutes the CURRENTLY STORED amount whenever `amount` is absent
// (`request.getAmount() == null ? majorAmount(link.getAmountMinor(), ...)`),
// so omitting it would silently keep the old figure and a "clear the amount"
// edit would do nothing. An explicit 0 is accepted for VARIABLE (only
// negatives are rejected) and resolves to the same stored 0 the create path
// would have produced from a null.
export function amountPayloadForMode(amountMode, value) {
  if (!amountRequiredForMode(amountMode) && !String(value ?? "").trim()) return 0;
  return Number(value) || 0;
}
