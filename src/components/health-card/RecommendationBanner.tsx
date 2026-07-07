import type { DecisionConfidence } from "@/engine/aegis-core";
import type { RecommendationView, Driver } from "@/view-models/healthCard";
import ConfidenceChip from "./ConfidenceChip";

/**
 * The hero. Band-coloured by decision tone, it states the call and — the
 * signature detail — sets the net score beside 2–3 plain-language drivers
 * (↑ strengths, ↓ risks) pulled straight from the decision trace.
 */
export default function RecommendationBanner({
  view,
  adjustedNetScore,
  alternativeEvidenceScore,
  confidence,
  drivers,
}: {
  view: RecommendationView;
  adjustedNetScore: number;
  alternativeEvidenceScore: number;
  confidence: DecisionConfidence;
  drivers: Driver[];
}) {
  const { colors } = view;
  return (
    <section
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: colors.border, background: colors.tint, borderLeft: `4px solid ${colors.line}` }}
    >
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:gap-10 md:p-8">
        {/* decision */}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.accent }}>
            Aegis recommendation
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight" style={{ color: colors.ink }}>
            {view.title}
          </h2>
          <p className="mt-1 text-sm" style={{ color: colors.ink }}>{view.subtitle}</p>
          <div className="mt-4">
            <ConfidenceChip confidence={confidence} />
          </div>
        </div>

        {/* net score + signature drivers */}
        <div className="md:border-l md:pl-10" style={{ borderColor: colors.border }}>
          <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">
            {alternativeEvidenceScore > 0 ? "Adjusted net" : "Net score"}
          </p>
          <p className="mt-0.5 text-5xl font-semibold tabular-nums leading-none" style={{ color: colors.accent }}>
            {adjustedNetScore}
          </p>
          {alternativeEvidenceScore > 0 && (
            <p className="mt-1 text-xs font-medium text-[#1D6F42]">incl. +{alternativeEvidenceScore} verified evidence</p>
          )}
          {drivers.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {drivers.map(d => (
                <li key={d.label} className="flex items-baseline gap-2 text-sm">
                  <span
                    aria-hidden
                    className="tabular-nums font-semibold"
                    style={{ color: d.direction === "up" ? "#1D6F42" : "#B23A1E" }}
                  >
                    {d.direction === "up" ? "↑" : "↓"}
                  </span>
                  <span className="text-[#44403C]">{d.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
