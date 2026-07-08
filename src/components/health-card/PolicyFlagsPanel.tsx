import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { HardFlag } from "@/engine/aegis-core";

/**
 * POLICY FLAGS — hard flags that override the score outright. When present, this
 * card stands alone in terracotta and speaks only in compliance terms: the
 * breach and its basis, and that it requires manual review. No score, strength,
 * or evidence is shown beside a breach — the flag is the decision. When there
 * are none, a calm, reassuring clear state (not an alarm).
 */
export default function PolicyFlagsPanel({ flags }: { flags: HardFlag[] }) {
  const clean = flags.length === 0;

  return (
    <section
      className={`rounded-xl border p-6 ${clean ? "border-[#1a473140] bg-[#f0fdf4]" : "border-[#dc262640] bg-[#fef2f2]"}`}
    >
      <div className="flex items-center gap-2">
        {clean
          ? <ShieldCheck className="h-[18px] w-[18px] text-[#15803d]" strokeWidth={1.75} />
          : <ShieldAlert className="h-[18px] w-[18px] text-[#dc2626]" strokeWidth={1.75} />}
        <h2 className={`text-sm font-semibold ${clean ? "text-[#15803d]" : "text-[#dc2626]"}`}>
          Policy Flags <span className="font-normal opacity-70">(Hard Flags)</span>
        </h2>
      </div>

      {clean ? (
        <>
          <p className="mt-3 text-sm font-medium text-[#15803d]">No hard policy flags</p>
          <p className="mt-0.5 text-sm text-[#4B5563]">All policy checks passed.</p>
        </>
      ) : (
        <ul className="mt-3 space-y-4">
          {flags.map(f => (
            <li key={f.code} className="border-l-2 border-[#dc2626] pl-3">
              <p className="text-sm font-semibold text-[#dc2626]">{f.label}</p>
              <p className="mt-0.5 text-sm text-[#dc2626]/90">{f.basis}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#dc2626]">Requires manual review</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
