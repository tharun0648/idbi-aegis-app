import { assess, type CoreAssessment, type MSMEProfile } from "@/engine/aegis-core";
import { SEEDS, type SeededBusiness } from "@/data/seeds";
import { narrate } from "@/ai/narrator";

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
  businessNarrative: string | null;   // the ONLY LLM-authored field; null when the narrator is off/unavailable
}

function toMeta(b: SeededBusiness): BusinessMeta {
  return {
    id: b.id, businessName: b.businessName, archetype: b.archetype, emoji: b.emoji,
    bureauScore: b.bureauScore, bureauVerdict: b.bureauVerdict,
  };
}

export async function getAssessment(id: string): Promise<EnrichedAssessment | null> {
  const seed = SEEDS[id as SeededBusiness["id"]];
  if (!seed) return null;
  const core: CoreAssessment = assess(seed.profile);
  const meta = toMeta(seed);
  return {
    ...core,
    business: meta,
    businessNarrative: await narrate(core, meta), // null unless the narrator is configured & succeeds
  };
}

export function listBusinesses(): BusinessMeta[] {
  return Object.values(SEEDS).map(toMeta);
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
    businessNarrative: await narrate(core, AD_HOC_META),
  };
}
