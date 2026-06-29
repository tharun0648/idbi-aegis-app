import type { DecisionConfidence } from "@/engine/aegis-core";

/**
 * Decision confidence — band + score as a chip, with the engine's reason
 * string spelled out beside it. Renders only from decisionConfidence.
 */
export default function ConfidenceChip({ confidence }: { confidence: DecisionConfidence }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-px inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#E7E5E4] bg-white/70 px-2 py-1 text-xs font-medium text-[#44403C]">
        <span className="uppercase tracking-wide text-[#78716C]">Confidence</span>
        <span className="text-[#1C1917]">{confidence.band}</span>
        <span className="tabular-nums text-[#A8A29E]">{confidence.score}</span>
      </span>
      <p className="text-xs leading-relaxed text-[#57534E]">{confidence.reason}</p>
    </div>
  );
}
