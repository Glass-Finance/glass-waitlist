import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { dateInputToIso, daysInMonth } from "../../utils/date";

describe("dateInputToIso", () => {
  it("returns null for an empty/missing input", () => {
    expect(dateInputToIso("")).toBeNull();
    expect(dateInputToIso(null)).toBeNull();
  });

  it("parses a plain date-only string in the local timezone, not UTC", () => {
    const iso = dateInputToIso("2026-07-07");
    const local = new Date(2026, 6, 7, 0, 0, 0, 0);
    expect(iso).toBe(local.toISOString());
  });

  describe("with a fixed 'now'", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 6, 15, 10, 0, 0));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("clampToNow leaves a future date untouched", () => {
      const iso = dateInputToIso("2026-08-01", { clampToNow: true });
      expect(iso).toBe(new Date(2026, 7, 1).toISOString());
    });

    it("clampToNow bumps a past/today date to just after the current instant", () => {
      const iso = dateInputToIso("2026-07-15", { clampToNow: true });
      expect(new Date(iso).getTime()).toBeGreaterThan(Date.now());
    });

    it("endOfDayIfToday pushes today's date to 23:59:59.999 local", () => {
      const iso = dateInputToIso("2026-07-15", { endOfDayIfToday: true });
      expect(iso).toBe(new Date(2026, 6, 15, 23, 59, 59, 999).toISOString());
    });

    it("endOfDayIfToday leaves a non-today date untouched", () => {
      const iso = dateInputToIso("2026-07-20", { endOfDayIfToday: true });
      expect(iso).toBe(new Date(2026, 6, 20, 0, 0, 0, 0).toISOString());
    });
  });
});

describe("daysInMonth", () => {
  it("returns 31 for a 31-day month (July)", () => {
    expect(daysInMonth(2026, 7)).toBe(31);
  });

  it("returns 30 for a 30-day month (April)", () => {
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it("returns 28 for February in a non-leap year", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
  });

  it("returns 29 for February in a leap year", () => {
    expect(daysInMonth(2028, 2)).toBe(29);
  });
});
