import type { MSMEProfile, Penalty, HardFlag, Recommendation, DecisionConfidence } from "@/engine/aegis-core";

/**
 * The shape of the `_debug` field returned by POST /api/assess (development
 * only — see route.ts). Lives outside the route so UI consumers (Transparency
 * Panel, the assess wizard) import a plain type module, not a route handler.
 */
export interface AssessDebug {
  rawProfile: MSMEProfile;
  engineOutputs: {
    capabilityScore: number;
    penalties: Penalty[];
    netScore: number;
    alternativeEvidenceScore: number;
    adjustedNetScore: number;
    hardFlags: HardFlag[];
    recommendation: Recommendation;
    decisionConfidence: DecisionConfidence;
  };
  narratorModel: string | null;
  narratorPrompt: string | null;
  narratorResponse: string | null;
}
