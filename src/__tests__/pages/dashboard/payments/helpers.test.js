import { describe, it, expect } from "vitest";
import {
  amountModesForPlanType,
  resolveAmountMode,
  amountRequiredForMode,
  validateAmountForMode,
  amountPayloadForMode,
  validatePlanField,
} from "../../../../pages/dashboard/payments/helpers";

// These are the rules the backend enforces in
// CollectionPaymentSupport.validatePaymentTypeAmount, expressed once so the
// create wizard, the edit modal and the payload builders cannot disagree. They
// are pinned here because the DTO says something weaker and misleading:
// UpsertPaymentLinkRequest marks amountMode @NotNull and leaves amount
// un-annotated, which reads as "amount is always optional". The service is
// what actually decides.
describe("amountModesForPlanType", () => {
  it("allows only FIXED for recurring plans", () => {
    // validatePaymentTypeAmount: `case RECURRING -> amountMode == FIXED`.
    // Anything else is a 400 ("Amount mode is not allowed for payment type").
    expect(amountModesForPlanType("recurring")).toEqual(["FIXED"]);
    expect(amountModesForPlanType("RECURRING")).toEqual(["FIXED"]);
  });

  it("allows all four modes for one-time plans", () => {
    expect(amountModesForPlanType("one_time")).toEqual([
      "FIXED",
      "MINIMUM",
      "SUGGESTED",
      "VARIABLE",
    ]);
  });
});

describe("resolveAmountMode", () => {
  it("keeps a mode the plan type allows", () => {
    expect(resolveAmountMode("one_time", "SUGGESTED")).toBe("SUGGESTED");
    expect(resolveAmountMode("recurring", "FIXED")).toBe("FIXED");
  });

  it("clamps a mode the plan type rejects", () => {
    // Reachable in the create wizard: pick VARIABLE on a one-time plan, go
    // Back, switch to recurring. The payload must not carry VARIABLE.
    expect(resolveAmountMode("recurring", "VARIABLE")).toBe("FIXED");
    expect(resolveAmountMode("recurring", "MINIMUM")).toBe("FIXED");
    expect(resolveAmountMode("one_time", undefined)).toBe("FIXED");
  });
});

describe("amountRequiredForMode", () => {
  it("requires an amount for every mode except VARIABLE", () => {
    // The service rejects a null/non-positive amount for FIXED, MINIMUM and
    // SUGGESTED; VARIABLE is exempt (resolvedAmountMinor maps null to 0).
    expect(amountRequiredForMode("FIXED")).toBe(true);
    expect(amountRequiredForMode("MINIMUM")).toBe(true);
    expect(amountRequiredForMode("SUGGESTED")).toBe(true);
    expect(amountRequiredForMode("VARIABLE")).toBe(false);
  });
});

describe("validateAmountForMode", () => {
  it("still requires a positive amount for the non-variable modes", () => {
    expect(validateAmountForMode("", "FIXED")).toBe("Amount is required.");
    expect(validateAmountForMode("   ", "SUGGESTED")).toBe("Amount is required.");
    expect(validateAmountForMode("0", "MINIMUM")).toBe("Enter an amount greater than 0.");
    expect(validateAmountForMode("-5", "FIXED")).toBe("Enter an amount greater than 0.");
    expect(validateAmountForMode("5000", "FIXED")).toBe("");
  });

  it("accepts a blank amount for VARIABLE but still rejects a bad one", () => {
    expect(validateAmountForMode("", "VARIABLE")).toBe("");
    expect(validateAmountForMode("  ", "VARIABLE")).toBe("");
    // A negative amount is rejected by the backend in EVERY mode.
    expect(validateAmountForMode("-1", "VARIABLE")).toBe("Enter an amount greater than 0.");
    expect(validateAmountForMode("0", "VARIABLE")).toBe("Enter an amount greater than 0.");
    // A VARIABLE plan may still carry a baseline/suggested figure.
    expect(validateAmountForMode("2500", "VARIABLE")).toBe("");
  });

  it("leaves the shared name/amount rule untouched", () => {
    expect(validatePlanField("name", "   ")).toBe("Plan name is required.");
    expect(validatePlanField("amount", "")).toBe("Amount is required.");
    expect(validatePlanField("amount", "0")).toBe("Enter an amount greater than 0.");
    expect(validatePlanField("name", "Dues")).toBe("");
  });
});

describe("amountPayloadForMode", () => {
  it("sends an explicit 0 for a blank VARIABLE amount", () => {
    // Not an omission: the PATCH handler substitutes the STORED amount when
    // `amount` is absent, so a "clear the amount" edit has to send 0 to have
    // any effect. 0 is accepted for VARIABLE (only negatives are rejected).
    expect(amountPayloadForMode("VARIABLE", "")).toBe(0);
    expect(amountPayloadForMode("VARIABLE", "   ")).toBe(0);
    expect(amountPayloadForMode("VARIABLE", undefined)).toBe(0);
  });

  it("passes a typed amount through as a number", () => {
    expect(amountPayloadForMode("VARIABLE", "2500")).toBe(2500);
    expect(amountPayloadForMode("FIXED", "5000")).toBe(5000);
    expect(amountPayloadForMode("SUGGESTED", "1500.50")).toBe(1500.5);
  });
});
