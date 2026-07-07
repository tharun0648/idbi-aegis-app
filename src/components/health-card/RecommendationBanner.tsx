import type { CoreAssessment } from "@/engine/aegis-core";
import { recommendationView } from "@/view-models/healthCard";
import { VERDICT_VISUAL } from "@/presentation/verdict";

/**
 * RECOMMENDATION — the decision, stated plainly and band-coloured.
 * Title/subtitle come from the frozen view-model; colour + icon from the shared
 * verdict map; the one-line rationale is the engine's decisionReason. No number
 * is computed here — it only phrases what the engine already decided.
 */
export default function RecommendationBanner({ a }: { a: CoreAssessment }) {
  const view = recommendationView(a.recommendation);
  const v = VERDICT_VISUAL[a.recommendation];
  const Icon = v.icon;

  return (
    <section
      className="flex items-start gap-4 rounded-xl border p-6"
      style={{ borderColor: v.color, backgroundColor: v.tint, borderLeftWidth: 4 }}
    >
      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
        <Icon className="h-6 w-6" strokeWidth={1.75} style={{ color: v.color }} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: v.color }}>Aegis recommendation</p>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight" style={{ color: v.color }}>{view.title}</h2>
        <p className="mt-1 text-sm text-[#374151]">{view.subtitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{a.decisionTrace.decisionReason}</p>
      </div>
    </section>
  );
}
