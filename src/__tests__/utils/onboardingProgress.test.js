import { describe, it, expect, afterEach } from "vitest";
import {
  saveOnboardingProgress,
  readOnboardingProgress,
  clearOnboardingProgress,
} from "../../utils/onboardingProgress";

afterEach(() => {
  sessionStorage.clear();
});

describe("onboarding progress persistence", () => {
  it("returns an empty object when nothing has been saved yet", () => {
    expect(readOnboardingProgress()).toEqual({});
  });

  it("round-trips a saved patch", () => {
    saveOnboardingProgress({ communityId: "abc-123" });
    expect(readOnboardingProgress()).toEqual({ communityId: "abc-123" });
  });

  it("merges successive patches instead of overwriting the whole object", () => {
    saveOnboardingProgress({ communityId: "abc-123" });
    saveOnboardingProgress({ step: "profile" });
    expect(readOnboardingProgress()).toEqual({ communityId: "abc-123", step: "profile" });
  });

  it("lets a later patch overwrite just the key it touches", () => {
    saveOnboardingProgress({ step: "profile" });
    saveOnboardingProgress({ step: "payment" });
    expect(readOnboardingProgress()).toEqual({ step: "payment" });
  });

  it("clears everything on clearOnboardingProgress", () => {
    saveOnboardingProgress({ communityId: "abc-123" });
    clearOnboardingProgress();
    expect(readOnboardingProgress()).toEqual({});
  });

  it("readOnboardingProgress survives corrupted JSON in storage instead of throwing", () => {
    sessionStorage.setItem("glass_onboarding_progress", "{not-json");
    expect(readOnboardingProgress()).toEqual({});
  });
});
