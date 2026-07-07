import { TrendingDown } from "lucide-react";
import type { Penalty } from "@/engine/aegis-core";

/**
 * SOFT PENALTIES — the engine's deductions, name + points + basis, with the
 * running total (= netScore − capabilityScore). Renders a calm empty state when
 * the file carries none. Nothing is computed here beyond summing engine points.
 */
export default function PenaltiesPanel({ penalties }: { penalties: Penalty[] }) {
  const total = penalties.reduce((s, p) => s + p.points, 0);

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-6">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-[18px] w-[18px] text-[#B42318]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-[#111827]">Soft Penalties <span className="font-normal text-[#6B7280]">(Deductions)</span></h2>
      </div>

      {penalties.length === 0 ? (
        <p className="mt-4 text-sm text-[#6B7280]">No penalties applied — the file carries no soft risk deductions.</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-[#F1F3F2]">
            {penalties.map(p => (
              <li key={p.name} className="flex items-start justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111827]">{p.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">{p.basis}</p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-[#B42318]">{p.points}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-baseline justify-between border-t border-[#E5E7EB] pt-4">
            <span className="text-sm font-medium text-[#111827]">Total Deductions</span>
            <span className="text-sm font-semibold tabular-nums text-[#B42318]">{total} <span className="font-normal text-[#9CA3AF]">/ 100</span></span>
          </div>
        </>
      )}
    </section>
  );
}
