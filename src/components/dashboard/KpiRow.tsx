import type { BusinessSummary } from "@/engine/assessmentAdapter";
import type { Recommendation } from "@/engine/aegis-core";
import { VERDICT_VISUAL } from "@/presentation/verdict";

/**
 * KPI ROW — four presentation-only counts derived from the 8 seeds' AEGIS
 * recommendations via listBusinessSummaries(). One card per Recommendation
 * enum value; no new counting logic, just a filter over engine output.
 * Cards themselves stay calm (white, bordered); only the count number takes
 * the recommendation's colour, per Design Spec v1.0.
 */
const KPI_DEFS: ReadonlyArray<{ label: string; rec: Recommendation }> = [
  { label: "Pending Today", rec: "DECLINE_WITH_PATH" },
  { label: "Needs Review", rec: "CONDITIONAL" },
  { label: "Approved", rec: "APPROVE" },
  { label: "Declined", rec: "REFER_OR_DECLINE" },
];

export default function KpiRow({ businesses }: { businesses: BusinessSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {KPI_DEFS.map(({ label, rec }) => {
        const count = businesses.filter((b) => b.recommendation === rec).length;
        const v = VERDICT_VISUAL[rec];
        return (
          <div key={rec} className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: v.color }}>{count}</p>
          </div>
        );
      })}
    </div>
  );
}
