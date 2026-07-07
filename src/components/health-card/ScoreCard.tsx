import type { RecommendationView } from "@/view-models/healthCard";

/**
 * The arithmetic, as labelled rows — never a bare number. Shows how
 * capability and soft penalties net out, then names the resulting call.
 * Values come straight from the assessment; nothing is recomputed here
 * beyond the capability − net difference for display.
 */
export default function ScoreCard({
  netScore,
  capabilityScore,
  adjustedNetScore,
  alternativeEvidenceScore,
  view,
}: {
  netScore: number;
  capabilityScore: number;
  adjustedNetScore: number;
  alternativeEvidenceScore: number;
  view: RecommendationView;
}) {
  const softPenalties = netScore - capabilityScore; // ≤ 0
  // Evidence rows show ONLY when a bonus applies (never on hard-flagged profiles,
  // where the engine sets alternativeEvidenceScore = 0). Net stays the frozen
  // core figure; Adjusted net is the decision figure.
  const hasEvidence = alternativeEvidenceScore > 0;

  return (
    <section className="rounded-lg border border-[#E7E5E4] bg-white p-6">
      <h2 className="text-sm font-semibold text-[#1C1917]">Score breakdown</h2>
      <dl className="mt-4 space-y-0 divide-y divide-[#F0EFED]">
        <Row label="Capability" value={`${capabilityScore}`} />
        <Row label="Soft penalties" value={`${softPenalties}`} tone={softPenalties < 0 ? "#B23A1E" : undefined} />
        <Row label="Net score" value={`${netScore}`} emphasize={!hasEvidence} tone={hasEvidence ? undefined : view.colors.accent} />
        {hasEvidence && (
          <>
            <Row label="Verified evidence" value={`+${alternativeEvidenceScore}`} tone="#1D6F42" />
            <Row label="Adjusted net" value={`${adjustedNetScore}`} emphasize tone={view.colors.accent} />
          </>
        )}
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[#E7E5E4] pt-4">
        <dt className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Recommendation</dt>
        <dd className="text-right text-sm font-semibold" style={{ color: view.colors.ink }}>{view.title}</dd>
      </div>
    </section>
  );
}

function Row({ label, value, tone, emphasize }: { label: string; value: string; tone?: string; emphasize?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className={`text-sm ${emphasize ? "font-medium text-[#1C1917]" : "text-[#57534E]"}`}>{label}</dt>
      <dd
        className={`tabular-nums ${emphasize ? "text-lg font-semibold" : "text-sm font-medium"}`}
        style={{ color: tone ?? "#1C1917" }}
      >
        {value}
      </dd>
    </div>
  );
}
