import { ShieldCheck, Zap, Users, Droplets, FileText, type LucideIcon } from "lucide-react";
import type { AltEvidence } from "@/engine/altEvidence";
import { ALT_EVIDENCE_CAP } from "@/engine/altEvidence";

/**
 * VERIFIED OPERATIONAL EVIDENCE — the four optional signals from
 * altEvidence.breakdown, each with its observed value and points contributed.
 * Rendered only when there is a bonus and no hard flag (guaranteed by the
 * caller). Supplementary to the core factors; every number is an engine field.
 */
const SIGNAL_ICON: Record<string, LucideIcon> = {
  "Electricity usage trend": Zap,
  "Workforce trend": Users,
  "Utility bill payments": Droplets,
  "TReDS invoice financing": FileText,
};

export default function EvidencePanel({ evidence, total }: { evidence: AltEvidence; total: number }) {
  // Show signals that were actually provided (a value beyond "Not available").
  const rows = evidence.breakdown.filter(r => r.value !== "Not available");

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-[18px] w-[18px] text-[#15803d]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-[#111827]">Verified Operational Evidence</h2>
      </div>
      <p className="mt-1 text-xs text-[#6B7280]">Independently verifiable operating signals.</p>

      <ul className="mt-4 divide-y divide-[#F1F3F2]">
        {rows.map(r => {
          const Icon = SIGNAL_ICON[r.signal] ?? ShieldCheck;
          return (
            <li key={r.signal} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0fdf4]">
                <Icon className="h-4 w-4 text-[#15803d]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111827]">{r.signal}</p>
                <p className="text-xs text-[#6B7280]">{r.value}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: r.contribution > 0 ? "#15803d" : "#9CA3AF" }}>
                {r.contribution > 0 ? `+${r.contribution}` : "—"}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-baseline justify-between border-t border-[#E5E7EB] pt-4">
        <span className="text-sm font-medium text-[#111827]">Total Operational Evidence</span>
        <span className="text-sm font-semibold tabular-nums text-[#15803d]">
          +{total} <span className="font-normal text-[#9CA3AF]">/ {ALT_EVIDENCE_CAP}</span>
        </span>
      </div>
    </section>
  );
}
