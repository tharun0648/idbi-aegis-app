"use client";

import { useState } from "react";
import { Terminal, ChevronDown } from "lucide-react";
import type { AssessDebug } from "@/types/debug";
import { PROFILE_FIELD_ORDER } from "@/constants/profileFields";

function fmt(v: unknown): string {
  if (v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * Collapsible accordion showing the exact inputs/outputs/narrator payload that
 * produced this assessment. Closed by default. Renders only what the API
 * actually returned in `_debug` — no placeholder rows, no invented data.
 */
export default function TransparencyPanel({ debug }: { debug: AssessDebug }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex min-h-[44px] w-full items-center gap-3 px-6 py-4 text-left"
        aria-expanded={open}
      >
        <Terminal className="h-[18px] w-[18px] shrink-0 text-[#6B7280]" strokeWidth={1.75} />
        <span className="text-sm font-medium text-[#374151]">Engine Computation Log</span>
        <span className="hidden text-xs text-[#9CA3AF] sm:inline">View raw inputs, scores, and narrator payload</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div className="divide-y divide-[#F1F3F2] border-t border-[#E5E7EB]">
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Raw Input Profile</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">These are the 13 signals submitted to the Aegis engine.</p>
            <table className="mt-3 w-full border-collapse text-xs font-mono">
              <tbody>
                {PROFILE_FIELD_ORDER.map((key, i) => (
                  <tr key={key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                    <td className="px-3 py-1.5 text-[#6B7280]">{key}</td>
                    <td className="px-3 py-1.5 text-[#111827]">{fmt(debug.rawProfile[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Engine Outputs</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Computed deterministically. No model involved.</p>
            <table className="mt-3 w-full border-collapse text-xs font-mono">
              <tbody>
                {(Object.entries(debug.engineOutputs) as Array<[string, unknown]>).map(([key, value], i) => (
                  <tr key={key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                    <td className="px-3 py-1.5 align-top text-[#6B7280]">{key}</td>
                    <td className="px-3 py-1.5 text-[#111827]">{fmt(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Narrator</p>
            {debug.narratorResponse === null ? (
              <p className="mt-2 text-sm text-[#6B7280]">Narrator fallback active — static text used.</p>
            ) : (
              <>
                <p className="mt-2 text-xs font-mono text-[#6B7280]">Model: {debug.narratorModel}</p>
                <p className="mt-3 text-xs font-medium text-[#374151]">Prompt sent:</p>
                <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-[#f9fafb] p-3 text-xs font-mono text-[#6B7280]">
                  {debug.narratorPrompt}
                </pre>
                <p className="mt-3 text-xs font-medium text-[#374151]">Response received:</p>
                <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-[#f9fafb] p-3 text-xs font-mono text-[#6B7280]">
                  {debug.narratorResponse}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
