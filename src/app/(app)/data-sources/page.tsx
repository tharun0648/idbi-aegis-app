import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MOAT, ENGINE, DATA_ECOSYSTEM } from "@/data/presentation";

const PIPELINE = [
  "Ecosystem sources",
  "13 core + 4 optional signals",
  "Deterministic engine (assess())",
  "Financial Health Card",
  "Underwriter decision",
];

/**
 * DATA SOURCES — technical reference for judges, reviewers, and developers.
 * Explains where signals come from, how they flow into a decision, and why
 * every recommendation is auditable. Pure presentation: reuses the same
 * MOAT/ENGINE/DATA_ECOSYSTEM copy as the landing page (data/presentation.ts)
 * so the two never drift out of sync. No scoring, no engine calls.
 */
export default function DataSourcesPage() {
  return (
    <main className="px-8 py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#111827]">Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" strokeWidth={2} />
          <span className="font-medium text-[#111827]">Data Sources</span>
        </nav>

        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Technical reference</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827]">Data sources & explainability</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
            An explainable credit-intelligence layer built on India&rsquo;s digital financial infrastructure. This is
            the single reference for where Aegis&rsquo;s signals come from, how they flow into a decision, and why
            every recommendation can be audited line by line.
          </p>
          <p className="mt-2 max-w-2xl text-xs italic text-[#9CA3AF]">
            Illustrative: this page describes the ecosystem Aegis is designed to consume. The live demo scores the
            seeded and submitted profiles directly — it does not perform a live pull from these sources.
          </p>
        </header>

        <section className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">India&rsquo;s Digital Public Infrastructure</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#374151]">
            Aegis doesn&rsquo;t collect new data or replace existing lending systems. It reads signals that already
            exist across India&rsquo;s public digital infrastructure — GSTN tax filings, the Account Aggregator
            consent framework, BBPS utility payments, TReDS invoice financing, EPFO/ESIC workforce records, MCA/UDYAM
            business registration, and traditional credit bureau history — and brings them together into one
            explainable Financial Health Card.
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Data flow into Aegis</h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            {PIPELINE.map((step, i) => (
              <div key={step} className="flex flex-1 items-center gap-3">
                <div className="flex min-h-[64px] flex-1 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#f9fafb] p-3 text-center">
                  <span className="text-xs font-medium text-[#111827]">{step}</span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-[#9CA3AF] sm:block" strokeWidth={2} />
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#9CA3AF]">
            The engine is a pure function of its input signals — no LLM, no HTTP call, and no persistence inside{" "}
            <code className="rounded bg-[#f3f4f6] px-1 py-0.5 font-mono">src/engine/aegis-core.ts</code>. The same
            profile always produces the same score.
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Source-to-signal mapping</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DATA_ECOSYSTEM.map(d => {
              const Icon = d.icon;
              return (
                <div key={d.source} className="flex flex-col rounded-xl border border-[#E5E7EB] bg-[#f9fafb] p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0fdf4]">
                    <Icon className="h-[18px] w-[18px] text-[#1a4731]" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-[#111827]">{d.source}</h3>
                  <p className="mt-1 text-xs text-[#6B7280]">{d.purpose}</p>
                  <ul className="mt-3 space-y-1">
                    {d.signals.map(s => (
                      <li key={s} className="text-xs leading-relaxed text-[#6B7280]">· {s}</li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-block w-fit rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
                    {d.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Explainability philosophy</h2>
          <div className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {ENGINE.map(e => {
              const Icon = e.icon;
              return (
                <div key={e.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white">
                    <Icon className="h-[18px] w-[18px] text-[#1a4731]" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-[#111827]">{e.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{e.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {MOAT.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="rounded-lg border border-[#E5E7EB] bg-[#f9fafb] p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0fdf4]">
                    <Icon className="h-[18px] w-[18px] text-[#1a4731]" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold tracking-tight text-[#111827]">{m.title}</h3>
                  <p className="mt-1 text-sm font-medium text-[#111827]">{m.lead}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{m.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Consent model</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#374151]">
            Where a source requires it, Aegis is designed to read only consented data. Account Aggregator signals
            flow through the RBI-regulated AA consent framework — the business explicitly authorises which accounts
            and what time range a lender may see. GSTN, BBPS, EPFO/ESIC, and MCA/UDYAM are government-verified
            records accessed under the borrower&rsquo;s consent for the credit application. Aegis never receives raw
            account data or source documents directly — only the verified, bounded signals listed above.
          </p>
        </section>
      </div>
    </main>
  );
}
