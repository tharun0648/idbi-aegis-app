import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listBusinessSummaries } from "@/engine/assessmentAdapter";
import { VERDICT_VISUAL } from "@/presentation/verdict";

const bureauLabel: Record<string, string> = { reject: "Reject", borderline: "Borderline", approvable: "Approvable" };

export default function Dashboard() {
  const businesses = listBusinessSummaries();
  return (
    <main className="mx-auto max-w-[1000px] px-8 py-8">
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

      <ul className="mt-6 space-y-3">
        {businesses.map(({ meta, recommendation }) => {
          const v = VERDICT_VISUAL[recommendation];
          const Icon = v.icon;
          return (
            <li key={meta.id}>
              <Link
                href={`/business/${meta.id}`}
                className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white p-4 transition-colors duration-150 hover:border-[#1F5E4A]"
              >
                <div className="flex items-center gap-3.5">
                  {/* status icon coloured by the AEGIS verdict, never the bureau verdict */}
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: v.tint }}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: v.color }} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{meta.businessName}</p>
                    <p className="mt-0.5 text-xs text-[#6B7280]">
                      <span className="font-medium" style={{ color: v.color }}>Aegis: {v.label}</span>
                      <span className="mx-1.5 text-[#D1D5DB]">·</span>
                      Bureau: {meta.bureauScore ?? "Thin file"}
                      {meta.bureauVerdict in bureauLabel ? ` (${bureauLabel[meta.bureauVerdict]})` : ""}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F5E4A]">
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
