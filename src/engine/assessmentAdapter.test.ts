import { describe, it, expect } from "vitest";
import { assessAdHoc } from "@/engine/assessmentAdapter";
import type { NarratorTrace } from "@/ai/narrator";
import { EXAMPLE_DEFAULT_PROFILE } from "@/engine/profileSchema";
import { assess } from "@/engine/aegis-core";

describe("assessAdHoc narrator trace threading", () => {
  it("accepts an optional trace and doesn't alter the returned assessment", async () => {
    const trace: NarratorTrace = { model: null, prompt: null, response: null };
    const withTrace = await assessAdHoc(EXAMPLE_DEFAULT_PROFILE, trace);
    const withoutTrace = await assessAdHoc(EXAMPLE_DEFAULT_PROFILE);

    expect(withTrace.netScore).toBe(withoutTrace.netScore);
    expect(withTrace.recommendation).toBe(withoutTrace.recommendation);
    expect(withTrace.business.id).toBe("custom");
    // No GROQ_API_KEY in the test env → narrator never ran → trace stays empty.
    expect(trace.prompt).toBeNull();
  });

  it("engine-freeze regression: assessAdHoc's engine fields exactly match a direct assess() call", async () => {
    const trace: NarratorTrace = { model: null, prompt: null, response: null };
    const viaAdapter = await assessAdHoc(EXAMPLE_DEFAULT_PROFILE, trace);
    const direct = assess(EXAMPLE_DEFAULT_PROFILE);

    // Compare every deterministic engine field field-by-field (excluding the
    // adapter-added business/businessNarrative keys, which assess() doesn't return).
    expect(viaAdapter.factors).toEqual(direct.factors);
    expect(viaAdapter.penalties).toEqual(direct.penalties);
    expect(viaAdapter.hardFlags).toEqual(direct.hardFlags);
    expect(viaAdapter.capabilityScore).toBe(direct.capabilityScore);
    expect(viaAdapter.netScore).toBe(direct.netScore);
    expect(viaAdapter.alternativeEvidenceScore).toBe(direct.alternativeEvidenceScore);
    expect(viaAdapter.adjustedNetScore).toBe(direct.adjustedNetScore);
    expect(viaAdapter.altEvidence).toEqual(direct.altEvidence);
    expect(viaAdapter.recommendation).toBe(direct.recommendation);
    expect(viaAdapter.decisionConfidence).toEqual(direct.decisionConfidence);
    expect(viaAdapter.decisionTrace).toEqual(direct.decisionTrace);
    expect(viaAdapter.improvementPlan).toEqual(direct.improvementPlan);
  });
});
