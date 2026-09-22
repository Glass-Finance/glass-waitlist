import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  tryAcquireRefreshLease,
  releaseRefreshLease,
  readRefreshResult,
  publishRefreshResult,
  waitForRefreshResult,
  coordinateRefresh,
  getTabId,
  REFRESH_LEASE_KEY,
  REFRESH_RESULT_KEY,
  LEASE_TTL_MS,
  REQUEST_TIMEOUT_MS,
  LEASE_MARGIN_MS,
  RefreshEpochChangedError,
  RefreshFailedError,
  RefreshUnavailableError,
} from "../../api/refreshCoordinator";
import { getSessionEpoch, bumpSessionEpoch } from "../../store/sessionStorage";

function writeForeignLease(expiresInMs) {
  localStorage.setItem(
    REFRESH_LEASE_KEY,
    JSON.stringify({ owner: "foreign-tab", at: Date.now(), expiresAt: Date.now() + expiresInMs }),
  );
}

function storageEvent(key) {
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

describe("refreshCoordinator lease", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("derives the lease TTL from the request timeout plus margin (no magic numbers)", () => {
    expect(LEASE_TTL_MS).toBe(REQUEST_TIMEOUT_MS + LEASE_MARGIN_MS);
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    expect(LEASE_MARGIN_MS).toBeGreaterThan(0);
  });

  it("elects a single owner; a held lease blocks acquisition", () => {
    expect(tryAcquireRefreshLease()).toBe(true);
    // Same tab re-entry also waits — in-tab dedup lives one layer up.
    expect(tryAcquireRefreshLease()).toBe(false);
  });

  it("a foreign unexpired lease blocks; an expired one does not", () => {
    writeForeignLease(10_000);
    expect(tryAcquireRefreshLease()).toBe(false);
    writeForeignLease(-1_000);
    expect(tryAcquireRefreshLease()).toBe(true);
  });

  it("release only removes our own lease", () => {
    writeForeignLease(10_000);
    releaseRefreshLease();
    expect(localStorage.getItem(REFRESH_LEASE_KEY)).not.toBeNull();
    localStorage.clear();
    expect(tryAcquireRefreshLease()).toBe(true);
    releaseRefreshLease();
    expect(localStorage.getItem(REFRESH_LEASE_KEY)).toBeNull();
  });

  it("each tab instance has a distinct owner id", async () => {
    const first = getTabId();
    vi.resetModules();
    const { getTabId: second } = await import("../../api/refreshCoordinator");
    expect(second()).not.toBe(first);
  });
});

describe("waitForRefreshResult", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("resolves with the stored access token when the owner publishes success", async () => {
    const epoch = getSessionEpoch();
    localStorage.setItem("accessToken", "fresh-token");
    writeForeignLease(10_000);
    const waiting = waitForRefreshResult({ epoch, pollMs: 5 });
    publishRefreshResult({ ok: true });
    storageEvent(REFRESH_RESULT_KEY);
    await expect(waiting).resolves.toEqual({ outcome: "refreshed", accessToken: "fresh-token" });
  });

  it("rejects with REFRESH_FAILED when the owner reports failure", async () => {
    writeForeignLease(10_000);
    const waiting = waitForRefreshResult({ epoch: getSessionEpoch(), pollMs: 5 });
    publishRefreshResult({ ok: false });
    storageEvent(REFRESH_RESULT_KEY);
    await expect(waiting).rejects.toMatchObject({ code: "REFRESH_FAILED" });
  });

  it("rejects with SESSION_CHANGED when the generation moves mid-wait (logout)", async () => {
    const epoch = getSessionEpoch();
    writeForeignLease(10_000);
    const waiting = waitForRefreshResult({ epoch, pollMs: 5 });
    // Simulate another tab logging out: epoch bump without touching us.
    bumpSessionEpoch();
    storageEvent("glass_session_epoch");
    await expect(waiting).rejects.toMatchObject({ code: "SESSION_CHANGED" });
  });

  it("returns takeover when the lease vanishes with no result (crashed owner)", async () => {
    writeForeignLease(10_000);
    const waiting = waitForRefreshResult({ epoch: getSessionEpoch(), pollMs: 5 });
    localStorage.removeItem(REFRESH_LEASE_KEY);
    storageEvent(REFRESH_LEASE_KEY);
    await expect(waiting).resolves.toEqual({ outcome: "takeover" });
  });
});

describe("coordinateRefresh", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("owner executes once and publishes; a waiter observes without executing", async () => {
    const epoch = getSessionEpoch();
    // Owner holds the lease before the waiter starts.
    expect(tryAcquireRefreshLease()).toBe(true);

    const waiter = coordinateRefresh({
      epoch,
      execute: vi.fn(async () => {
        throw new Error("waiter must never execute");
      }),
      waitOptions: { pollMs: 5 },
    });
    // Owner path runs inline: simulate its completion.
    publishRefreshResult({ ok: true });
    localStorage.setItem("accessToken", "fresh-token");
    releaseRefreshLease();
    storageEvent(REFRESH_RESULT_KEY);

    await expect(waiter).resolves.toBe("fresh-token");
    expect(readRefreshResult()).toMatchObject({ ok: true });
  });

  it("takes over after a stale lease and executes", async () => {
    writeForeignLease(-1_000); // crashed owner
    const executor = vi.fn(async () => "recovered-token");
    await expect(coordinateRefresh({ epoch: getSessionEpoch(), execute: executor })).resolves.toBe(
      "recovered-token",
    );
    expect(executor).toHaveBeenCalledTimes(1);
  });

  it("adopts a rotated session instead of presenting a stale token", async () => {
    localStorage.setItem("accessToken", "fresh-token");
    localStorage.setItem("refreshToken", "fresh-refresh");
    const executor = vi.fn(async () => {
      throw new Error("must never execute with a stale token");
    });
    // Our 401 was read before another tab rotated; election happens after.
    await expect(
      coordinateRefresh({
        epoch: getSessionEpoch(),
        refreshToken: "stale-refresh",
        execute: executor,
      }),
    ).resolves.toBe("fresh-token");
  });

  it("propagates owner failure without retrying (reuse safety)", async () => {
    const failure = new Error("backend 401");
    const executor = vi.fn(async () => {
      throw failure;
    });
    await expect(coordinateRefresh({ epoch: getSessionEpoch(), execute: executor })).rejects.toBe(
      failure,
    );
    expect(executor).toHaveBeenCalledTimes(1);
    expect(readRefreshResult()).toMatchObject({ ok: false });
  });

  it("propagates epoch changes instead of applying stale work", async () => {
    const epoch = getSessionEpoch();
    const executor = vi.fn(async () => {
      // Epoch moved while executing (logout elsewhere).
      bumpSessionEpoch();
      throw new RefreshEpochChangedError();
    });
    await expect(coordinateRefresh({ epoch, execute: executor })).rejects.toMatchObject({
      code: "SESSION_CHANGED",
    });
  });

  it("throws without an executor", async () => {
    await expect(coordinateRefresh({ epoch: 0 })).rejects.toBeInstanceOf(RefreshUnavailableError);
  });
});
