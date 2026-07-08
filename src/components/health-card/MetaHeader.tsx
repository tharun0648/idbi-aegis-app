import { Building2, ShieldCheck, ArrowRight } from "lucide-react";
import type { EnrichedAssessment } from "@/engine/assessmentAdapter";
import { recommendationView } from "@/view-models/healthCard";
import { VERDICT_VISUAL } from "@/presentation/verdict";
import { BUSINESS_PRESENTATION } from "@/data/presentation";

const bureauLabel: Record<string, string> = { reject: "Reject", borderline: "Borderline", approvable: "Approvable" };

/**
 * META HEADER — business identity, static descriptive chrome, and the
 * Bureau → Aegis thesis (the whole point: what the bureau says vs what Aegis
 * decides). Scored values come from the engine; turnover/GSTIN/etc. are static
 * presentation data (presentation.ts) and are labelled as descriptive, never scored.
 */
export default function MetaHeader({ a }: { a: EnrichedAssessment }) {
  const { business, decisionConfidence } = a;
  const view = recommendationView(a.recommendation);
  const verdict = VERDICT_VISUAL[a.recommendation];
  const pres = BUSINESS_PRESENTATION[business.id]; // undefined for ad-hoc "custom"

  const metaLine = [pres?.industry, pres?.location, pres && `Established ${pres.establishedYear}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="rounded-xl border border-[#E5E7EB] bg-white p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* identity + chrome */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0fdf4]">
              <Building2 className="h-6 w-6 text-[#1a4731]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{business.archetype}</p>
              <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-[#111827]">{business.businessName}</h1>
              {metaLine && <p className="mt-1 text-sm text-[#6B7280]">{metaLine}</p>}
            </div>
          </div>

          {pres && (
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              <Chrome label="Annual Turnover" value={pres.annualTurnover} />
              <Chrome label="GSTIN" value={pres.gstin} mono />
            </dl>
          )}

          {/* Bureau → Aegis — the thesis */}
          <div className="mt-5 flex flex-wrap items-stretch gap-3">
            <div className="rounded-lg border border-[#E5E7EB] bg-[#f3f4f6] px-4 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">Credit bureau</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#111827]">
                {business.bureauScore ?? "Thin file"}
                <span className="ml-2 font-normal text-[#6B7280]">{bureauLabel[business.bureauVerdict] ?? business.bureauVerdict}</span>
              </p>
            </div>
            <div className="flex items-center text-[#D1D5DB]" aria-hidden>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="rounded-lg border px-4 py-2.5" style={{ borderColor: verdict.color, backgroundColor: verdict.tint }}>
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: verdict.color }}>Aegis</p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: verdict.color }}>{view.title}</p>
            </div>
          </div>
        </div>

        {/* Decision Confidence */}
        <div className="w-full shrink-0 rounded-xl border border-[#1a473140] bg-[#f0fdf4] p-5 lg:w-[300px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#4B5563]">Decision Confidence</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a4731]">{decisionConfidence.band}</p>
            </div>
            <ShieldCheck className="h-7 w-7 shrink-0 text-[#1a4731]" strokeWidth={1.5} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{decisionConfidence.reason}</p>
        </div>
      </div>
    </header>
  );
}

function Chrome({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium text-[#111827] ${mono ? "font-mono tabular-nums" : ""}`}>{value}</dd>
    </div>
  );
}
