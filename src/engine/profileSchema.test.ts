import { describe, it, expect } from "vitest";
import { assess, type MSMEProfile } from "@/engine/aegis-core";
import { validateProfile, EXAMPLE_DEFAULT_PROFILE } from "@/engine/profileSchema";

/**
 * Boundary + engine-guard tests. The contract: garbage never reaches a
 * silent NaN or a false APPROVE. The engine fails LOUD; the boundary rejects.
 */

describe("engine guard (assertAssessable)", () => {
  it("THROWS on a non-finite number rather than scoring silently", () => {
    const bad = { ...EXAMPLE_DEFAULT_PROFILE, gstOnTimeRate: NaN } as MSMEProfile;
    expect(() => assess(bad)).toThrow(/finite/i);

    const inf = { ...EXAMPLE_DEFAULT_PROFILE, avgReceivableDays: Infinity } as MSMEProfile;
    expect(() => assess(inf)).toThrow(/finite/i);
  });

  it("THROWS on an unknown enum value", () => {
    const bad = { ...EXAMPLE_DEFAULT_PROFILE, cashflowTrend: "skyrocketing" } as unknown as MSMEProfile;
    expect(() => assess(bad)).toThrow(/cashflowTrend/i);
  });

  it("never produces a silent false-APPROVE from garbage", () => {
    const garbage = { ...EXAMPLE_DEFAULT_PROFILE, gstOnTimeRate: NaN } as MSMEProfile;
    // It must throw — it must NOT return an assessment with a NaN/APPROVE.
    expect(() => assess(garbage)).toThrow();
  });
});

describe("validateProfile (boundary)", () => {
  it("rejects an out-of-range gstOnTimeRate with a per-field message", () => {
    const res = validateProfile({ ...EXAMPLE_DEFAULT_PROFILE, gstOnTimeRate: 1.5 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.gstOnTimeRate).toMatch(/between 0 and 1/i);
  });

  it("rejects NaN / non-finite input before the engine is ever called", () => {
    const res = validateProfile({ ...EXAMPLE_DEFAULT_PROFILE, avgReceivableDays: Number.NaN });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.avgReceivableDays).toBeDefined();
  });

  it("rejects a non-integer gstMaxGapCycles", () => {
    const res = validateProfile({ ...EXAMPLE_DEFAULT_PROFILE, gstMaxGapCycles: 1.5 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.gstMaxGapCycles).toMatch(/whole number/i);
  });

  it("treats topVendorShare as a percent (0–100), not a ratio", () => {
    expect(validateProfile({ ...EXAMPLE_DEFAULT_PROFILE, topVendorShare: 0.5 }).ok).toBe(true);
    expect(validateProfile({ ...EXAMPLE_DEFAULT_PROFILE, topVendorShare: 140 }).ok).toBe(false);
  });

  it("accepts a valid arbitrary profile, and it assesses cleanly", () => {
    const arbitrary: MSMEProfile = {
      cashflowTrend: "improving",
      gstOnTimeRate: 0.72,
      gstMaxGapCycles: 1,
      gstLastCycleLate: true,
      digitalReceiptsShare: 0.6,
      digitalHistoryMonths: 9,
      yearsOperating: 3,
      avgReceivableDays: 48,
      topVendorShare: 28,
      seasonality: "moderate",
      seasonalCashDip: false,
      activeDefault: false,
      kycMismatch: false,
    };
    const res = validateProfile(arbitrary);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const a = assess(res.profile);
      expect(Number.isFinite(a.netScore)).toBe(true);
      expect(["APPROVE", "CONDITIONAL", "DECLINE_WITH_PATH", "REFER_OR_DECLINE"]).toContain(a.recommendation);
    }
  });
});
