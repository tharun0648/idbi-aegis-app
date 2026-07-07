"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { MODEL_VERSION, ENGINE_DESCRIPTOR, assessmentDateLabel } from "@/data/presentation";

/**
 * BUSINESS NARRATIVE + assessment meta.
 * The narrative is the LLM-authored businessNarrative (rendered only when
 * non-null) with an explicit "AI-generated, for reference only" caption.
 * Beside it, descriptive chrome: the Assessment Date is request-time (client
 * only, set after mount to avoid any hydration mismatch — it is NOT engine
 * data), plus the model version and the deterministic-engine moat statement.
 */
export default function NarrativePanel({ narrative }: { narrative: string | null }) {
  const [date, setDate] = useState<string>("—");
  useEffect(() => { setDate(assessmentDateLabel()); }, []);

  return (
    <section className="grid gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-[18px] w-[18px] text-[#1F5E4A]" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-[#111827]">Business Narrative</h2>
        </div>
        {narrative ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-[#374151]">{narrative}</p>
            <p className="mt-4 text-xs italic text-[#9CA3AF]">
              This narrative is AI-generated based on the assessment factors and should be used for reference only.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-[#6B7280]">
            No narrative generated. The full assessment above is the deterministic record; narration is optional and adds nothing to the decision.
          </p>
        )}
      </div>

      <dl className="space-y-0 divide-y divide-[#F1F3F2] rounded-lg bg-[#F8FAF9] p-4">
        <MetaRow label="Assessment Date" value={date} />
        <MetaRow label="Model Version" value={MODEL_VERSION} />
        <MetaRow label="Engine" value={ENGINE_DESCRIPTOR} />
      </dl>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="text-right text-sm font-medium text-[#111827]">{value}</dd>
    </div>
  );
}
