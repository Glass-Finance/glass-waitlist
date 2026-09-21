import { describe, it, expect, beforeEach } from "vitest";
import {
  SESSION_KEYS,
  KEY_TOKEN,
  getAccessToken,
  getRefreshToken,
  readStoredUser,
  writeStoredUser,
  persistSession,
  applyRefreshedTokens,
  clearSessionStorage,
  onSessionEnd,
} from "../../store/sessionStorage";

describe("sessionStorage — single owner of session keys", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("owns the full session key list both clear paths must remove", () => {
    expect(SESSION_KEYS).toEqual(
      expect.arrayContaining([
        "accessToken",
        "refreshToken",
        "glass_user",
        "userId",
        "userEmail",
        "glass_community",
        "glass_member_community",
      ]),
    );
    expect(SESSION_KEYS).toHaveLength(7);
  });

  it("persistSession stores tokens + identity without writing literal 'undefined'", () => {
    persistSession({ accessToken: "a", userId: "u", email: "e@example.com" });
    expect(localStorage.getItem("accessToken")).toBe("a");
    expect(localStorage.getItem("userId")).toBe("u");
    expect(localStorage.getItem("userEmail")).toBe("e@example.com");
    // Missing refreshToken must not create a truthy "undefined" string.
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("applyRefreshedTokens overwrites access and rotates refresh when present", () => {
    localStorage.setItem("accessToken", "old");
    localStorage.setItem("refreshToken", "old-refresh");
    applyRefreshedTokens({ accessToken: "new" });
    expect(localStorage.getItem("accessToken")).toBe("new");
    expect(localStorage.getItem("refreshToken")).toBe("old-refresh");
    applyRefreshedTokens({ accessToken: "new2", refreshToken: "new-refresh" });
    expect(localStorage.getItem("refreshToken")).toBe("new-refresh");
  });

  it("clearSessionStorage removes every session key and notifies listeners", () => {
    SESSION_KEYS.forEach((k) => localStorage.setItem(k, "x"));
    localStorage.setItem("unrelated", "keep");
    let notified = 0;
    const unsub = onSessionEnd(() => {
      notified += 1;
    });
    clearSessionStorage();
    SESSION_KEYS.forEach((k) => expect(localStorage.getItem(k)).toBeNull());
    expect(localStorage.getItem("unrelated")).toBe("keep");
    expect(notified).toBe(1);
    unsub();
    // Idempotent — safe for N queued 401s calling it in the same tick.
    expect(() => clearSessionStorage()).not.toThrow();
  });

  it("read/writeStoredUser round-trips and tolerates corrupt JSON", () => {
    expect(readStoredUser()).toBeNull();
    writeStoredUser({ id: "1" });
    expect(readStoredUser()).toEqual({ id: "1" });
    writeStoredUser(null);
    expect(localStorage.getItem("glass_user")).toBeNull();
    localStorage.setItem("glass_user", "{broken");
    expect(readStoredUser()).toBeNull();
  });

  it(`getAccessToken reads the same "${KEY_TOKEN}" key the interceptor uses`, () => {
    localStorage.setItem(KEY_TOKEN, "tok");
    expect(getAccessToken()).toBe("tok");
    expect(getRefreshToken()).toBeNull();
  });
});
