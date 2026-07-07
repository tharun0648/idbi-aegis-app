import { TrendingUp } from "lucide-react";
import type { Factor } from "@/engine/aegis-core";

/**
 * POSITIVE FACTORS — the real six weighted factors, each shown with its engine
 * value/max and basis string. Grouped Strengths (≥ 0.7 · max) vs Developing,
 * the same 0.7 threshold the engine uses for primaryDrivers so the two never
 * disagree. The Total is capabilityScore from the engine — and it equals the
 * sum of the six rows on screen (the UI does not add anything up itself).
 */
export default function FactorsPanel({ factors, capabilityScore, className = "" }: { factors: Factor[]; capabilityScore: number; className?: string }) {
  const strengths = factors.filter(f => f.value / f.max >= 0.7);
  const developing = factors.filter(f => f.value / f.max < 0.7);

  return (
    <section className={`rounded-xl border border-[#E5E7EB] bg-white p-6 ${className}`}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-[18px] w-[18px] text-[#1F5E4A]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-[#111827]">Positive Factors <span className="font-normal text-[#6B7280]">(Strengths)</span></h2>
      </div>

      <div className="mt-4 space-y-5">
        <Group label="Strengths" factors={strengths} />
        <Group label="Developing" factors={developing} />
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-[#E5E7EB] pt-4">
        <span className="text-sm font-medium text-[#111827]">Total Capability Score</span>
        <span className="text-sm font-semibold tabular-nums text-[#111827]">
          {capabilityScore} <span className="font-normal text-[#9CA3AF]">/ 100</span>
        </span>
      </div>
    </section>
  );
}

function Group({ label, factors }: { label: string; factors: Factor[] }) {
  if (factors.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      <div className="mt-1 divide-y divide-[#F1F3F2]">
        {factors.map(f => <Row key={f.name} factor={f} />)}
      </div>
    </div>
  );
}

function Row({ factor }: { factor: Factor }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#111827]">{factor.name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">{factor.basis}</p>
      </div>
      <span className="shrink-0 text-sm tabular-nums text-[#111827]">
        {factor.value}
        <span className="text-[#9CA3AF]"> / {factor.max}</span>
      </span>
    </div>
  );
}
