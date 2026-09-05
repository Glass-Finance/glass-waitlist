import { describe, it, expect } from "vitest";
import { shapeObligation } from "../../hooks/payments/shape";

function unpaidObligations(obligations) {
  return obligations.filter((obligation) => obligation.status !== "PAID");
}

describe("authoritative obligation status", () => {
  it("normalizes the backend SUCCESSFUL status to PAID", () => {
    expect(shapeObligation({ status: "SUCCESSFUL" }).status).toBe("PAID");
  });

  it("preserves non-paid backend statuses", () => {
    expect(shapeObligation({ status: "DUE" }).status).toBe("DUE");
    expect(shapeObligation({ status: "WAIVED" }).status).toBe("WAIVED");
    expect(shapeObligation({ status: "REFUNDED" }).status).toBe("REFUNDED");
  });

  it("filters paid obligations using status only", () => {
    const obligations = [
      shapeObligation({ id: "paid", status: "PAID" }),
      shapeObligation({ id: "due", status: "DUE" }),
      shapeObligation({ id: "waived", status: "WAIVED" }),
    ];

    expect(
      unpaidObligations(obligations).map((obligation) => obligation.id),
    ).toEqual(["due", "waived"]);
  });
});
