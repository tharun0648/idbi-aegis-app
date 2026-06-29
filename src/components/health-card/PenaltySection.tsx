import type { Penalty } from "@/engine/aegis-core";
import PenaltyBadge from "./PenaltyBadge";

/**
 * Soft penalties, with their running total. Renders nothing when the
 * borrower carries none — an empty card would just be noise.
 */
export default function PenaltySection({ penalties }: { penalties: Penalty[] }) {
  if (penalties.length === 0) return null;
  const total = penalties.reduce((s, p) => s + p.points, 0);

  return (
    <section className="rounded-lg border border-[#E7E5E4] bg-white p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#1C1917]">Soft penalties</h2>
        <span className="text-sm font-semibold tabular-nums text-[#B23A1E]">{total}</span>
      </div>
      <p className="mt-0.5 text-xs text-[#78716C]">Risk deductions applied to the capability score.</p>
      <div className="mt-3 divide-y divide-[#F0EFED]">
        {penalties.map(p => <PenaltyBadge key={p.name} penalty={p} />)}
      </div>
    </section>
  );
}
