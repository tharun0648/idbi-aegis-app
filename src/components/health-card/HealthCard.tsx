import type { EnrichedAssessment } from "@/engine/assessmentAdapter";
import MetaHeader from "./MetaHeader";
import RecommendationBanner from "./RecommendationBanner";
import ScoreEquation from "./ScoreEquation";
import EvidencePanel from "./EvidencePanel";
import FactorsPanel from "./FactorsPanel";
import PenaltiesPanel from "./PenaltiesPanel";
import PolicyFlagsPanel from "./PolicyFlagsPanel";
import NarrativePanel from "./NarrativePanel";

/**
 * THE HEALTH CARD — enterprise assessment layout.
 * Pure orchestration: it composes panels, each of which renders straight from
 * EnrichedAssessment fields. No score math, no decision logic, no invented data.
 *
 * Evidence is shown only when the engine actually granted a bounded uplift and
 * there is no hard flag — both guaranteed by the engine (alternativeEvidenceScore
 * is 0 and altEvidence.breakdown is empty whenever a hard flag is present).
 */
export default function HealthCard({ a }: { a: EnrichedAssessment }) {
  const showEvidence = a.alternativeEvidenceScore > 0 && a.hardFlags.length === 0;

  return (
    <article className="mx-auto w-full max-w-[1180px] space-y-6">
      <MetaHeader a={a} />
      <RecommendationBanner a={a} />
      <ScoreEquation a={a} />

      <div className="grid gap-6 lg:grid-cols-3">
        {showEvidence && <EvidencePanel evidence={a.altEvidence} total={a.alternativeEvidenceScore} />}
        <FactorsPanel factors={a.factors} capabilityScore={a.capabilityScore} className={showEvidence ? "" : "lg:col-span-2"} />
        <div className="space-y-6">
          <PenaltiesPanel penalties={a.penalties} />
          <PolicyFlagsPanel flags={a.hardFlags} />
        </div>
      </div>

      <NarrativePanel narrative={a.businessNarrative} />
    </article>
  );
}
