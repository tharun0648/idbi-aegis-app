import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listBusinessSummaries } from "@/engine/assessmentAdapter";
import { VERDICT_VISUAL } from "@/presentation/verdict";
import { BUSINESS_PRESENTATION, DEMO_INSIGHT } from "@/data/presentation";
import KpiRow from "@/components/dashboard/KpiRow";

const bureauLabel: Record<string, string> = { reject: "Reject", borderline: "Borderline", approvable: "Approvable" };

export default function Dashboard() {
  const businesses = listBusinessSummaries();

  return (
    <main className="mx-auto max-w-[1100px] px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">Applications</h1>
          <p className="mt-1 text-sm text-[#6B7280]">MSME applications awaiting underwriting review.</p>
        </div>
        <Link
          href="/assess"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#1F5E4A] px-4 py-2 text-sm font-medium text-[#1F5E4A] transition-opacity duration-150 hover:opacity-80"
        >
          Assess any profile <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-6">
        <KpiRow businesses={businesses} />
      </div>

      <ul className="mt-6 space-y-3">
        {businesses.map(({ meta, recommendation, decisionConfidence }) => {
          const v = VERDICT_VISUAL[recommendation];
          const Icon = v.icon;
          const pres = BUSINESS_PRESENTATION[meta.id];
          const insight = DEMO_INSIGHT[meta.id];
          return (
            <li key={meta.id}>
              <Link
                href={`/business/${meta.id}`}
                className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-colors duration-150 hover:border-[#1F5E4A] sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  {/* status icon coloured by the AEGIS verdict, never the bureau verdict */}
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: v.tint }}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: v.color }} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[#111827]">{meta.businessName}</p>
                      {insight && (
                        <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
                          {insight.label}
                        </span>
                      )}
                    </div>
                    {pres && <p className="mt-0.5 text-xs text-[#6B7280]">{pres.industry} · {pres.location}</p>}
                    <p className="mt-1 text-xs text-[#6B7280]">
                      <span className="font-medium" style={{ color: v.color }}>Aegis: {v.label}</span>
                      <span className="mx-1.5 text-[#D1D5DB]">·</span>
                      Bureau: {meta.bureauScore ?? "Thin file"}
                      {meta.bureauVerdict in bureauLabel ? ` (${bureauLabel[meta.bureauVerdict]})` : ""}
                      <span className="mx-1.5 text-[#D1D5DB]">·</span>
                      Confidence: {decisionConfidence.band}
                    </p>
                    {insight && <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-[#9CA3AF]">{insight.note}</p>}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-medium text-[#1F5E4A] sm:mt-1">
                  Evaluate <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
