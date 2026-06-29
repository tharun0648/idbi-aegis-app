import { describe, it, expect } from "vitest";
import { assess, simulate } from "@/engine/aegis-core";
import { SEEDS, CLIMBER_LEVERS } from "@/data/seeds";

/**
 * These tests guard the DEMO NARRATIVE. If a weight or derivation tweak
 * breaks one, you've broken the story — fix the engine or the story, not the test.
 */

describe("Aegis demo narrative", () => {
  it("Invisible Champion: bureau-rejected, Aegis approves", () => {
    const a = assess(SEEDS.champion.profile);
    expect(a.recommendation).toBe("APPROVE");
    expect(a.hardFlags).toHaveLength(0);
    expect(a.netScore).toBeGreaterThanOrEqual(60);
  });

  it("The Mirage: decent surface, declined on a hard policy flag", () => {
    const a = assess(SEEDS.mirage.profile);
    expect(a.recommendation).toBe("REFER_OR_DECLINE");
    expect(a.hardFlags.map(f => f.code)).toContain("GST_FILING_GAP");
    // the score alone cannot buy past the knockout
  });

  it("The Climber: starts below the line, crosses it on the first lever", () => {
    const base = assess(SEEDS.climber.profile);
    expect(base.recommendation).toBe("DECLINE_WITH_PATH");
    expect(base.netScore).toBeLessThan(60);

    const oneLever = simulate(SEEDS.climber.profile, [CLIMBER_LEVERS[0]]);
    expect(oneLever.recommendation).toBe("APPROVE");
    expect(oneLever.netScore).toBeGreaterThanOrEqual(60);

    const allLevers = simulate(SEEDS.climber.profile, CLIMBER_LEVERS);
    expect(allLevers.netScore).toBeGreaterThan(oneLever.netScore);
  });

  it("no double-count: Mirage's GST problem is a hard flag, not also a soft penalty", () => {
    const a = assess(SEEDS.mirage.profile);
    expect(a.penalties.find(p => p.name === "Recent late GST")).toBeUndefined();
  });
});
