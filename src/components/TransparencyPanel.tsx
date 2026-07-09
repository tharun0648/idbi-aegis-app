"use client";

import { useState } from "react";
import { Terminal, ChevronDown } from "lucide-react";
import type { AssessDebug } from "@/types/debug";
import { PROFILE_FIELD_ORDER } from "@/constants/profileFields";

const DATA_PROVENANCE: ReadonlyArray<{ source: string; available: boolean; signals: string }> = [
  { source: "Credit Bureau", available: true, signals: "Bureau score" },
  { source: "GSTN", available: true, signals: "Filing consistency" },
  { source: "Account Aggregator", available: true, signals: "Cash-flow stability" },
  { source: "BBPS", available: true, signals: "Utility payments" },
  { source: "EPFO", available: false, signals: "Workforce stability" },
  { source: "TReDS", available: true, signals: "Invoice financing" },
];

/**
 * Renders one value cell in the Engine Outputs / Raw Input Profile tables.
 * Objects/arrays get a pretty-printed, scrollable JSON block so they never
 * blow out the row's width. Primitives wrap with break-words; on mobile they
 * additionally truncate to one line and expand on tap (own state per cell,
 * since each row's overflow behaviour is independent).
 */
function ValueCell({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false);

  if (value === undefined) {
    return <td className="px-3 py-1.5 align-top text-[#111827]">—</td>;
  }

  if (typeof value === "object" && value !== null) {
    return (
      <td className="px-3 py-1.5 align-top text-[#111827]">
        <pre className="max-w-full overflow-x-auto whitespace-pre-wrap rounded bg-[#f9fafb] p-2 text-xs font-mono text-[#111827]">
          {JSON.stringify(value, null, 2)}
        </pre>
      </td>
    );
  }

  return (
    <td className="px-3 py-1.5 align-top text-[#111827]">
      <span
        onClick={() => setExpanded((e) => !e)}
        className={`block max-w-full break-words ${
          expanded ? "whitespace-normal" : "cursor-pointer truncate sm:cursor-auto sm:whitespace-normal"
        }`}
        style={{ overflowWrap: "break-word" }}
      >
        {String(value)}
      </span>
    </td>
  );
}

/**
 * Collapsible accordion showing the exact inputs/outputs/narrator payload that
 * produced this assessment. Closed by default. Every section but the first
 * renders only what the API actually returned in `_debug` — no placeholder
 * rows, no invented data. The Data Provenance section is the one exception:
 * fixed editorial content describing the ecosystem Aegis is built to consume,
 * not a live check against this specific submission — labelled as such below.
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
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Data Provenance <span className="normal-case font-normal">(illustrative)</span></p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              A production deployment draws signals from these verified ecosystem participants. This table illustrates the
              ecosystem Aegis is built to consume — it is not a live check against this specific submission.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-left text-[#9CA3AF]">
                    <th className="px-3 py-1.5 font-medium">Source</th>
                    <th className="px-3 py-1.5 font-medium">Status</th>
                    <th className="px-3 py-1.5 font-medium">Signals Used</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_PROVENANCE.map((row, i) => (
                    <tr key={row.source} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                      <td className={`px-3 py-1.5 ${row.available ? "text-[#111827]" : "text-[#9CA3AF]"}`}>{row.source}</td>
                      <td className={`px-3 py-1.5 ${row.available ? "text-[#15803d]" : "text-[#9CA3AF]"}`}>{row.available ? "Available" : "Not Available"}</td>
                      <td className={`px-3 py-1.5 ${row.available ? "text-[#111827]" : "text-[#9CA3AF]"}`}>{row.signals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs italic text-[#9CA3AF]">Unavailable sources are ignored. They never create negative scores.</p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Raw Input Profile</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">These are the 13 required signals plus 4 optional operational-evidence signals submitted to the Aegis engine.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-xs font-mono">
                <colgroup>
                  <col className="w-2/5" />
                  <col />
                </colgroup>
                <tbody>
                  {PROFILE_FIELD_ORDER.map((key, i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                      <td className="break-words px-3 py-1.5 align-top text-[#6B7280]" style={{ overflowWrap: "break-word" }}>{key}</td>
                      <ValueCell value={debug.rawProfile[key]} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Engine Outputs</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Computed deterministically. No model involved.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-xs font-mono">
                <colgroup>
                  <col className="w-2/5" />
                  <col />
                </colgroup>
                <tbody>
                  {(Object.entries(debug.engineOutputs) as Array<[string, unknown]>).map(([key, value], i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                      <td className="break-words px-3 py-1.5 align-top text-[#6B7280]" style={{ overflowWrap: "break-word" }}>{key}</td>
                      <ValueCell value={value} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Narrator</p>
            {debug.narratorResponse === null ? (
              <p className="mt-2 text-sm text-[#6B7280]">Narrator fallback active — static text used.</p>
            ) : (
              <>
                <p className="mt-2 text-xs font-mono text-[#6B7280]">Model: {debug.narratorModel}</p>
                <p className="mt-3 text-xs font-medium text-[#374151]">Prompt sent:</p>
                <pre className="mt-1 max-h-48 overflow-y-auto overflow-x-auto whitespace-pre-wrap rounded bg-[#f9fafb] p-3 text-xs font-mono text-[#6B7280]">
                  {debug.narratorPrompt}
                </pre>
                <p className="mt-3 text-xs font-medium text-[#374151]">Response received:</p>
                <pre className="mt-1 max-h-48 overflow-y-auto overflow-x-auto whitespace-pre-wrap rounded bg-[#f9fafb] p-3 text-xs font-mono text-[#6B7280]">
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
