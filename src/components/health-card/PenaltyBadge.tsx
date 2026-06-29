import type { Penalty } from "@/engine/aegis-core";

/**
 * A single soft penalty: name + basis, with the point deduction in
 * terracotta. Soft penalties dent the score; they don't override it.
 */
export default function PenaltyBadge({ penalty }: { penalty: Penalty }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <span className="text-sm font-medium text-[#1C1917]">{penalty.name}</span>
        <span className="text-sm text-[#78716C]"> — {penalty.basis}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-[#B23A1E]">{penalty.points}</span>
    </div>
  );
}
