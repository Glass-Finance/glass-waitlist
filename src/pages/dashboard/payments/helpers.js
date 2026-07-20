import { FREQUENCY_UNIT_LABEL, WEEKDAYS } from "./constants";

export function intervalUnitLabel(frequency, interval) {
  const unit = FREQUENCY_UNIT_LABEL[frequency] ?? "cycle";
  const n = Number(interval);
  return n === 1 ? unit : `${unit}s`;
}

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// Human-readable billing day for review rows ("Monday" / "The 5th").
export function billingDayLabel(frequency, billingDay) {
  const day = Number(billingDay);
  if (!day) return "—";
  return frequency === "WEEKLY"
    ? (WEEKDAYS[day - 1] ?? String(day))
    : `The ${ordinal(day)}`;
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
