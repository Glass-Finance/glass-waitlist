import { describe, it, expect } from "vitest";
import { ordinal, scheduleCopy, estimateNextCharge } from "./recurring";

describe("ordinal", () => {
  it("suffixes common numbers correctly", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(4)).toBe("4th");
  });

  it("handles the 11th-13th exceptions (all 'th', not 'st'/'nd'/'rd')", () => {
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
  });

  it("handles the 21st/22nd/23rd pattern past the teens", () => {
    expect(ordinal(21)).toBe("21st");
    expect(ordinal(22)).toBe("22nd");
    expect(ordinal(23)).toBe("23rd");
  });
});

describe("scheduleCopy", () => {
  it("describes a simple monthly plan with a billing day", () => {
    expect(scheduleCopy({ frequency: "MONTHLY", interval: 1, billingDay: 5 }))
      .toBe("Every month on the 5th");
  });

  it("pluralizes the unit when interval > 1", () => {
    expect(scheduleCopy({ frequency: "DAILY", interval: 3 }))
      .toBe("Every 3 days");
  });

  it("names the weekday for a weekly plan with a billingDay 1-7", () => {
    expect(scheduleCopy({ frequency: "WEEKLY", interval: 1, billingDay: 1 }))
      .toBe("Every week on Mondays");
    expect(scheduleCopy({ frequency: "WEEKLY", interval: 2, billingDay: 7 }))
      .toBe("Every 2 weeks on Sundays");
  });

  it("omits the day suffix for DAILY plans even if billingDay is set", () => {
    expect(scheduleCopy({ frequency: "DAILY", interval: 1, billingDay: 5 }))
      .toBe("Every day");
  });

  it("falls back to 'cycle' for an unrecognized frequency", () => {
    expect(scheduleCopy({ frequency: "FORTNIGHTLY", interval: 1 }))
      .toBe("Every cycle");
  });

  it("defaults interval to 1 when missing", () => {
    expect(scheduleCopy({ frequency: "QUARTERLY" })).toBe("Every quarter");
  });
});

describe("estimateNextCharge", () => {
  it("adds the interval in days for a DAILY plan", () => {
    const next = estimateNextCharge({ frequency: "DAILY", interval: 3 }, "2026-07-01T00:00:00.000Z");
    expect(next.toISOString().slice(0, 10)).toBe("2026-07-04");
  });

  it("adds the interval in weeks for a WEEKLY plan", () => {
    const next = estimateNextCharge({ frequency: "WEEKLY", interval: 2 }, "2026-07-01T00:00:00.000Z");
    expect(next.toISOString().slice(0, 10)).toBe("2026-07-15");
  });

  it("adds the interval in months for a MONTHLY plan", () => {
    const next = estimateNextCharge({ frequency: "MONTHLY", interval: 1 }, "2026-07-01T00:00:00.000Z");
    expect(next.toISOString().slice(0, 10)).toBe("2026-08-01");
  });

  it("adds 3 months per interval for a QUARTERLY plan", () => {
    const next = estimateNextCharge({ frequency: "QUARTERLY", interval: 1 }, "2026-07-01T00:00:00.000Z");
    expect(next.toISOString().slice(0, 10)).toBe("2026-10-01");
  });

  it("adds a year for an ANNUALLY plan", () => {
    const next = estimateNextCharge({ frequency: "ANNUALLY", interval: 1 }, "2026-07-01T00:00:00.000Z");
    expect(next.toISOString().slice(0, 10)).toBe("2027-07-01");
  });

  it("returns null for an unrecognized frequency", () => {
    expect(estimateNextCharge({ frequency: "FORTNIGHTLY" }, "2026-07-01T00:00:00.000Z")).toBe(null);
  });

  it("returns null for an invalid fromDateStr", () => {
    expect(estimateNextCharge({ frequency: "MONTHLY" }, "not-a-date")).toBe(null);
  });

  it("defaults to today when fromDateStr is omitted", () => {
    const next = estimateNextCharge({ frequency: "DAILY", interval: 1 });
    expect(next).toBeInstanceOf(Date);
    expect(isNaN(next.getTime())).toBe(false);
  });
});
