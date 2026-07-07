import type { EnrichedAssessment } from "@/engine/assessmentAdapter";
import { recommendationView, selectDrivers } from "@/view-models/healthCard";
import RecommendationBanner from "./RecommendationBanner";
import ScoreCard from "./ScoreCard";
import FactorSection from "./FactorSection";
import PenaltySection from "./PenaltySection";
import EvidenceSection from "./EvidenceSection";
import PolicyFlags from "./PolicyFlags";

/**
 * The flagship screen. Pure orchestration: it resolves the decision
 * view-model once, then composes the parts. No score math, no decision
 * logic, no invented data — every value traces back to the assessment.
 */

const BUREAU_LABEL: Record<string, string> = {
  reject: "Reject",
  borderline: "Borderline",
  approvable: "Approvable",
};

export default function HealthCard({ a }: { a: EnrichedAssessment }) {
  const view = recommendationView(a.recommendation);
  const drivers = selectDrivers(a.decisionTrace);
  const { business } = a;

  return (
    <article className="mx-auto w-full max-w-[1180px]">
      {/* identity + Bureau-vs-Aegis delta */}
      <header className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">{business.archetype}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1C1917]">{business.businessName}</h1>
          </div>
          <div className="flex items-stretch gap-3 text-sm">
            <div className="rounded-lg border border-[#E7E5E4] bg-white px-4 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-[#A8A29E]">Credit bureau</p>
              <p className="mt-1 font-semibold tabular-nums text-[#1C1917]">
                {business.bureauScore ?? "Thin file"}
                <span className="ml-2 font-normal text-[#78716C]">
                  {BUREAU_LABEL[business.bureauVerdict] ?? business.bureauVerdict}
                </span>
              </p>
            </div>
            <div className="flex items-center text-[#D6D3D1]" aria-hidden>→</div>
            <div
              className="rounded-lg border px-4 py-2.5"
              style={{ borderColor: view.colors.border, background: view.colors.tint }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: view.colors.accent }}>Aegis</p>
              <p className="mt-1 font-semibold" style={{ color: view.colors.ink }}>{view.title}</p>
            </div>
          </div>
        </div>
      </header>

      <RecommendationBanner
        view={view}
        adjustedNetScore={a.adjustedNetScore}
        alternativeEvidenceScore={a.alternativeEvidenceScore}
        confidence={a.decisionConfidence}
        drivers={drivers}
      />

      {/* a hard flag is the reason for the call — give it the full width, up top */}
      {a.hardFlags.length > 0 && (
        <div className="mt-6">
          <PolicyFlags flags={a.hardFlags} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FactorSection factors={a.factors} />
          <PenaltySection penalties={a.penalties} />
          {/* Supplementary, below the core factors. Shows only when a bonus applies
              (evidence > 0) and there is no hard flag — both guaranteed by the engine. */}
          {a.alternativeEvidenceScore > 0 && a.hardFlags.length === 0 && (
            <EvidenceSection
              evidence={a.altEvidence}
              netScore={a.netScore}
              adjustedNetScore={a.adjustedNetScore}
              alternativeEvidenceScore={a.alternativeEvidenceScore}
              view={view}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <ScoreCard
            netScore={a.netScore}
            capabilityScore={a.capabilityScore}
            adjustedNetScore={a.adjustedNetScore}
            alternativeEvidenceScore={a.alternativeEvidenceScore}
            view={view}
          />
        </div>
      </div>

      {/* LLM-authored prose — phrases the decision the engine already made.
          Secondary to the banner; renders only when the narrator produced one. */}
      {a.businessNarrative && (
        <section className="mt-6 rounded-lg border border-[#EDEBE9] bg-[#FAFAF9] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[#A8A29E]">Assessment summary</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">{a.businessNarrative}</p>
        </section>
      )}
    </article>
  );
}
