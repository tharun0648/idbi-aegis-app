import { assess, type CoreAssessment, type MSMEProfile } from "@/engine/aegis-core";
import { SEEDS, type SeededBusiness } from "@/data/seeds";

/**
 * AssessmentService — the boundary between the pure engine and the app.
 * Owns: lookup, enrichment (narrative), and later db / ULI adapter / cache / auth.
 * The engine stays pure; all of that lives here.
 */

export interface BusinessMeta {
  id: string;
  businessName: string;
  archetype: string;
  emoji: string;
  bureauScore: number | null;
  bureauVerdict: string;
}

// The API contract. UI renders ONLY from this.
export interface EnrichedAssessment extends CoreAssessment {
  business: BusinessMeta;
  businessNarrative: string | null;   // the ONLY LLM-authored field; null until Day 3
}

function toMeta(b: SeededBusiness): BusinessMeta {
  return {
    id: b.id, businessName: b.businessName, archetype: b.archetype, emoji: b.emoji,
    bureauScore: b.bureauScore, bureauVerdict: b.bureauVerdict,
  };
}

export function getAssessment(id: string): EnrichedAssessment | null {
  const seed = SEEDS[id as SeededBusiness["id"]];
  if (!seed) return null;
  const core: CoreAssessment = assess(seed.profile);
  return {
    ...core,
    business: toMeta(seed),
    businessNarrative: null,   // Day 3: narrate(core) -> string, deterministic logic untouched
  };
}

export function listBusinesses(): BusinessMeta[] {
  return Object.values(SEEDS).map(toMeta);
}

/**
 * Narration — the ONLY LLM-authored step. It phrases an already-decided
 * result; it never computes a number or changes a decision. Null-safe: with
 * no key configured (and as the fallback whenever a call would fail) it
 * returns null and the UI renders the deterministic DecisionTrace instead.
 */
async function narrate(_core: CoreAssessment): Promise<string | null> {
  if (!process.env.AEGIS_NARRATOR_KEY) return null;
  // Day 3: call the model here to rephrase _core.decisionTrace into prose.
  //
  // IMPORTANT (alt-evidence layer): when there is NO hard flag, the decision
  // score the narrator must reference is _core.adjustedNetScore (core net +
  // verified operational evidence), NOT _core.netScore. When _core.hardFlags is
  // non-empty, adjustedNetScore == netScore and no evidence is in play. The
  // narrator only phrases an already-decided result; it never recomputes.
  //
  // Until then, stay on the deterministic fallback.
  return null;
}

const AD_HOC_META: BusinessMeta = {
  id: "custom",
  businessName: "Custom profile",
  archetype: "Evaluator input",
  emoji: "🧪",
  bureauScore: null,
  bureauVerdict: "Not pulled",
};

/**
 * Assess an arbitrary, already-validated profile (from the public input form).
 * Same pipeline as getAssessment, minus the seed lookup — the engine is the
 * single source of truth, the UI renders the same EnrichedAssessment.
 */
export async function assessAdHoc(profile: MSMEProfile): Promise<EnrichedAssessment> {
  const core: CoreAssessment = assess(profile);
  return {
    ...core,
    business: AD_HOC_META,
    businessNarrative: await narrate(core),
  };
}
