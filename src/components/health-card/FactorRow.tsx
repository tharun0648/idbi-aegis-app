import type { Factor } from "@/engine/aegis-core";

/**
 * One factor as a precision row: name + basis on the left, value/max on the
 * right, with a hairline track beneath. Strong rows carry the green accent.
 */
export default function FactorRow({ factor }: { factor: Factor }) {
  const ratio = factor.value / factor.max;
  const strong = ratio >= 0.7;
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-[#1C1917]">{factor.name}</span>
        <span className="shrink-0 text-sm tabular-nums text-[#1C1917]">
          {factor.value}
          <span className="text-[#A8A29E]">/{factor.max}</span>
        </span>
      </div>
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#F0EFED]">
        <div
          className="h-full rounded-full"
          style={{ width: `${ratio * 100}%`, background: strong ? "#1D6F42" : "#A8A29E" }}
        />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-[#78716C]">{factor.basis}</p>
    </div>
  );
}
