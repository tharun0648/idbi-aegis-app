import type { Factor } from "@/engine/aegis-core";
import FactorRow from "./FactorRow";

/**
 * FactorSection owns the grouping. Factors that clear 70% of their max read
 * as strengths; the rest as developing areas — the same 0.7 threshold the
 * engine uses for primaryDrivers, so the two views never disagree.
 */
function Group({ label, factors }: { label: string; factors: Factor[] }) {
  if (factors.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#A8A29E]">{label}</p>
      <div className="mt-1 divide-y divide-[#F0EFED]">
        {factors.map(f => <FactorRow key={f.name} factor={f} />)}
      </div>
    </div>
  );
}

export default function FactorSection({ factors }: { factors: Factor[] }) {
  const strengths = factors.filter(f => f.value / f.max >= 0.7);
  const developing = factors.filter(f => f.value / f.max < 0.7);

  return (
    <section className="rounded-lg border border-[#E7E5E4] bg-white p-6">
      <h2 className="text-sm font-semibold text-[#1C1917]">Capability factors</h2>
      <p className="mt-0.5 text-xs text-[#78716C]">Six weighted signals, scored against their maximum.</p>
      <div className="mt-5 space-y-6">
        <Group label="Strengths" factors={strengths} />
        <Group label="Developing" factors={developing} />
      </div>
    </section>
  );
}
