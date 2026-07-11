import { describe, it, expect } from "vitest";
import {
  formatNaira,
  formatNairaCompact,
  toTitleCase,
  formatDate,
  formatDateLong,
  formatRelativeDateTime,
} from "./format";

describe("formatNaira", () => {
  it("formats a whole number with the naira sign and no decimals by default", () => {
    expect(formatNaira(12000)).toBe("₦12,000");
  });

  it("defaults null/undefined to ₦0", () => {
    expect(formatNaira(null)).toBe("₦0");
    expect(formatNaira(undefined)).toBe("₦0");
  });

  it("supports 2-decimal precision for receipts", () => {
    expect(formatNaira(12000, { decimals: 2 })).toBe("₦12,000.00");
  });

  it("renders a dash for null/undefined when emptyDash is set", () => {
    expect(formatNaira(null, { emptyDash: true })).toBe("—");
    expect(formatNaira(undefined, { emptyDash: true })).toBe("—");
  });

  it("does not apply emptyDash to a real zero amount", () => {
    expect(formatNaira(0, { emptyDash: true })).toBe("₦0");
  });
});

describe("formatNairaCompact", () => {
  it("abbreviates millions", () => {
    expect(formatNairaCompact(4_800_000)).toBe("₦4.80M");
  });

  it("abbreviates thousands", () => {
    expect(formatNairaCompact(4_800)).toBe("₦4.8K");
  });

  it("falls back to standard formatting below the K threshold", () => {
    expect(formatNairaCompact(500)).toBe("₦500");
  });

  it("returns a dash for null/undefined/NaN", () => {
    expect(formatNairaCompact(null)).toBe("—");
    expect(formatNairaCompact(undefined)).toBe("—");
    expect(formatNairaCompact("not a number")).toBe("—");
  });
});

describe("toTitleCase", () => {
  it("capitalizes the first letter of every word", () => {
    expect(toTitleCase("associate amount")).toBe("Associate Amount");
  });

  it("passes through falsy values unchanged", () => {
    expect(toTitleCase("")).toBe("");
    expect(toTitleCase(null)).toBe(null);
    expect(toTitleCase(undefined)).toBe(undefined);
  });
});

describe("formatDate", () => {
  it("formats with a short month name and full year", () => {
    expect(formatDate("2026-07-11T00:00:00.000Z")).toMatch(/\d{1,2} Jul 2026/);
  });

  it("returns a dash for a missing date", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("formatDateLong", () => {
  it("formats with a full month name", () => {
    expect(formatDateLong("2026-07-11T00:00:00.000Z")).toMatch(/July/);
  });

  it("returns a dash for a missing date", () => {
    expect(formatDateLong(null)).toBe("—");
  });
});

describe("formatRelativeDateTime", () => {
  it("labels a timestamp from today as 'Today'", () => {
    expect(formatRelativeDateTime(new Date().toISOString())).toMatch(/^Today /);
  });

  it("labels a timestamp from yesterday as 'Yesterday'", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDateTime(yesterday.toISOString())).toMatch(/^Yesterday /);
  });

  it("falls back to a dated format further back", () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 8);
    const result = formatRelativeDateTime(lastWeek.toISOString());
    expect(result).not.toMatch(/^Today|^Yesterday/);
  });

  it("returns an empty string for a missing date", () => {
    expect(formatRelativeDateTime(null)).toBe("");
    expect(formatRelativeDateTime(undefined)).toBe("");
  });
});
