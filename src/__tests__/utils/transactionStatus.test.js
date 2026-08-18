import { describe, it, expect } from "vitest";
import { transactionStatusLabel, transactionStatusStyle } from "../../utils/transactionStatus";

describe("transactionStatusLabel", () => {
  it("maps 'success' and 'successful' to Success", () => {
    expect(transactionStatusLabel("success")).toBe("Success");
    expect(transactionStatusLabel("successful")).toBe("Success");
  });

  it("maps 'failed' to Failed", () => {
    expect(transactionStatusLabel("failed")).toBe("Failed");
  });

  it("falls back to Pending for anything else, including unknown/missing status", () => {
    expect(transactionStatusLabel("processing")).toBe("Pending");
    expect(transactionStatusLabel(undefined)).toBe("Pending");
    expect(transactionStatusLabel(null)).toBe("Pending");
  });
});

describe("transactionStatusStyle", () => {
  it("returns the label plus its matching style classes", () => {
    const style = transactionStatusStyle("success");
    expect(style.label).toBe("Success");
    expect(style.text).toBe("Successful");
    expect(style.cls).toContain("success-tint");
  });

  it("falls back to the Pending style for an unrecognized status", () => {
    const style = transactionStatusStyle("weird-status");
    expect(style.label).toBe("Pending");
    expect(style.text).toBe("Pending");
  });
});
