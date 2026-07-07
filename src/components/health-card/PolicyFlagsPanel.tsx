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
      className={`rounded-xl border p-6 ${clean ? "border-[#CDE6DC] bg-[#F1F9F5]" : "border-[#F0DAD6] bg-[#FBF1EF]"}`}
    >
      <div className="flex items-center gap-2">
        {clean
          ? <ShieldCheck className="h-[18px] w-[18px] text-[#1F5E4A]" strokeWidth={1.75} />
          : <ShieldAlert className="h-[18px] w-[18px] text-[#B42318]" strokeWidth={1.75} />}
        <h2 className={`text-sm font-semibold ${clean ? "text-[#14532D]" : "text-[#B42318]"}`}>
          Policy Flags <span className="font-normal opacity-70">(Hard Flags)</span>
        </h2>
      </div>

      {clean ? (
        <>
          <p className="mt-3 text-sm font-medium text-[#14532D]">No hard policy flags</p>
          <p className="mt-0.5 text-sm text-[#4B5563]">All policy checks passed.</p>
        </>
      ) : (
        <ul className="mt-3 space-y-4">
          {flags.map(f => (
            <li key={f.code} className="border-l-2 border-[#B42318] pl-3">
              <p className="text-sm font-semibold text-[#7A2615]">{f.label}</p>
              <p className="mt-0.5 text-sm text-[#7A2615]/90">{f.basis}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#B42318]">Requires manual review</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
