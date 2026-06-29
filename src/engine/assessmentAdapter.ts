import { assess, type CoreAssessment } from "@/engine/aegis-core";
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
