import type { HardFlag } from "@/engine/aegis-core";

/**
 * Hard policy flags. These override the score outright, so this block stands
 * alone in terracotta and speaks in compliance terms. Renders only when a
 * flag exists — absence of this card means the file is policy-clean.
 */
export default function PolicyFlags({ flags }: { flags: HardFlag[] }) {
  if (flags.length === 0) return null;

  return (
    <section className="rounded-lg border-2 border-[#E7C4B8] bg-[#FBEAE5] p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#7A2615]">Policy violations</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-[#B23A1E]">Overrides score</span>
      </div>
      <p className="mt-1 text-xs text-[#7A2615]/80">
        Each item breaches a hard lending rule and must be cleared before approval.
      </p>
      <ul className="mt-4 space-y-3">
        {flags.map(f => (
          <li key={f.code} className="border-l-2 border-[#B23A1E] pl-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#7A2615]">{f.label}</span>
              <code className="rounded bg-white/60 px-1.5 py-0.5 text-[11px] tabular-nums text-[#B23A1E]">{f.code}</code>
            </div>
            <p className="mt-0.5 text-sm text-[#7A2615]/90">{f.basis}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
