import { describe, it, expect } from "vitest";
import { assess, simulate, type MSMEProfile } from "@/engine/aegis-core";
import { computeAltEvidence, ALT_EVIDENCE_CAP } from "@/engine/altEvidence";
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

describe("Alternative Evidence Layer (v1.2 plug-in)", () => {
  it("Verified Operator: CONDITIONAL on the core alone, APPROVE with evidence", () => {
    const withEvidence = assess(SEEDS.evidence.profile);
    const coreOnly: MSMEProfile = { ...SEEDS.evidence.profile };
    delete coreOnly.electricityTrend; delete coreOnly.workforceTrend;
    delete coreOnly.utilityPayment; delete coreOnly.tredsHistory;

    expect(assess(coreOnly).recommendation).toBe("CONDITIONAL"); // core-only lands below the approval line
    expect(assess(coreOnly).netScore).toBe(55);

    expect(withEvidence.netScore).toBe(55);                  // frozen core net is unchanged by the layer
    expect(withEvidence.alternativeEvidenceScore).toBe(7);   // electricity 3 + workforce 1 + bbps 3
    expect(withEvidence.adjustedNetScore).toBe(62);
    expect(withEvidence.recommendation).toBe("APPROVE");     // evidence carries it over the line
  });

  it("evidence is bounded: floored at 0 per signal, capped at +10 total, never negative", () => {
    const best = computeAltEvidence({ electricityTrend: "growing", workforceTrend: "growing", utilityPayment: "always_on_time", tredsHistory: "active" } as MSMEProfile);
    expect(best.points).toBeLessThanOrEqual(ALT_EVIDENCE_CAP);

    const worst = computeAltEvidence({ electricityTrend: "declining", workforceTrend: "declining", utilityPayment: "irregular", tredsHistory: "none" } as MSMEProfile);
    expect(worst.points).toBe(0); // weak signals contribute 0, never a deduction

    const absent = computeAltEvidence({} as MSMEProfile);
    expect(absent.points).toBe(0); // absent = 0 contribution
  });

  it("a hard flag suppresses all evidence: no bonus can buy past a knockout", () => {
    // Mirage is GST-hard-flagged; even loaded with perfect operational evidence it stays declined.
    const rescued = assess({ ...SEEDS.mirage.profile, electricityTrend: "growing", workforceTrend: "growing", utilityPayment: "always_on_time", tredsHistory: "active" });
    expect(rescued.hardFlags.length).toBeGreaterThan(0);
    expect(rescued.alternativeEvidenceScore).toBe(0);        // no evidence computed/merged when flagged
    expect(rescued.adjustedNetScore).toBe(rescued.netScore); // adjusted == raw net
    expect(rescued.recommendation).toBe("REFER_OR_DECLINE");
    expect(rescued.altEvidence.breakdown).toHaveLength(0);   // UI shows no evidence section
  });

  it("adjusted net never exceeds the 100 ceiling", () => {
    const a = assess({ ...SEEDS.prime.profile, electricityTrend: "growing", utilityPayment: "always_on_time", workforceTrend: "growing", tredsHistory: "active" });
    expect(a.adjustedNetScore).toBeLessThanOrEqual(100);
  });

  it("confidence blast radius: rich-core and flagged seeds are unmoved by the rework", () => {
    // No alt signals on these seeds → the coverage rework must reproduce the prior confidence exactly.
    expect(assess(SEEDS.champion.profile).decisionConfidence.score).toBe(90);
    expect(assess(SEEDS.prime.profile).decisionConfidence.score).toBe(98);
    expect(assess(SEEDS.mirage.profile).decisionConfidence.score).toBe(85);
    expect(assess(SEEDS.default.profile).decisionConfidence.score).toBe(85);
    expect(assess(SEEDS.kyc.profile).decisionConfidence.score).toBe(85);
  });
});
