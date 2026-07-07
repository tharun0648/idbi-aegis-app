import type { AltEvidence } from "@/engine/altEvidence";
import type { RecommendationView } from "@/view-models/healthCard";

/**
 * VERIFIED OPERATIONAL EVIDENCE — the alternative-evidence layer, made visible.
 *
 * Supplementary to the core factors, never a substitute for them. Renders ONLY
 * when a bonus actually applies (alternativeEvidenceScore > 0 AND no hard flag —
 * both already guaranteed by the caller). Lists the contributing operational
 * signals, then shows the Net → +Evidence → Adjusted Net arithmetic. No emoji,
 * no "bonus" language — this is verified evidence, presented plainly.
 */
export default function EvidenceSection({
  evidence,
  netScore,
  adjustedNetScore,
  alternativeEvidenceScore,
  view,
}: {
  evidence: AltEvidence;
  netScore: number;
  adjustedNetScore: number;
  alternativeEvidenceScore: number;
  view: RecommendationView;
}) {
  const contributing = evidence.breakdown.filter(r => r.contribution > 0);
  if (contributing.length === 0) return null;

  return (
    <section className="rounded-lg border border-[#CFE6D8] bg-[#F6FBF8] p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#14532D]">Verified Operational Evidence</h2>
        <span className="text-sm font-semibold tabular-nums text-[#1D6F42]">+{alternativeEvidenceScore}</span>
      </div>
      <p className="mt-0.5 text-xs text-[#57534E]">
        Independently verifiable operating signals, supplementary to the core assessment.
      </p>

      <ul className="mt-3 divide-y divide-[#DCEEE3]">
        {contributing.map(row => (
          <li key={row.signal} className="flex items-baseline justify-between gap-4 py-2.5">
            <span className="text-sm text-[#44403C]">
              {row.signal}
              <span className="ml-2 text-xs text-[#78716C]">{row.value}</span>
            </span>
            <span className="text-sm font-medium tabular-nums text-[#1D6F42]">+{row.contribution}</span>
          </li>
        ))}
      </ul>

      {/* Net → +Evidence → Adjusted Net */}
      <div className="mt-4 flex flex-wrap items-baseline gap-2 border-t border-[#DCEEE3] pt-4 text-sm tabular-nums">
        <span className="text-[#78716C]">Net {netScore}</span>
        <span className="text-[#A8A29E]">→</span>
        <span className="font-medium text-[#1D6F42]">+{alternativeEvidenceScore} evidence</span>
        <span className="text-[#A8A29E]">→</span>
        <span className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Adjusted net</span>
        <span className="text-lg font-semibold" style={{ color: view.colors.accent }}>{adjustedNetScore}</span>
      </div>
    </section>
  );
}
