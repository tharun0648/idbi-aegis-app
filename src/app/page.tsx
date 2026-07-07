import Link from "next/link";
import { Shield, LifeBuoy, ShieldAlert, TrendingUp, ArrowRight, Lock, Ban, Plus, MessageSquareText } from "lucide-react";
import { MODEL_VERSION } from "@/data/presentation";

/**
 * LANDING — the public entry at "/", shell-free. Written for a cold evaluator
 * who knows nothing about Aegis: what it is, the moat, and how the engine works.
 * Precision-Minimal: no gradients, gauges, glass, neon, illustrations, emoji.
 */

const MOAT = [
  {
    icon: LifeBuoy,
    title: "Rescue",
    lead: "Credit-invisible, creditworthy.",
    body: "Thin-file businesses with no bureau score but strong, verifiable operations get a fair read instead of an automatic rejection.",
  },
  {
    icon: ShieldAlert,
    title: "Catch",
    lead: "Bureau-approvable, actually risky.",
    body: "A clean bureau score cannot buy past a policy breach. Hard flags override any score, so surface-good, structurally-bad files are caught.",
  },
  {
    icon: TrendingUp,
    title: "Coach",
    lead: "Not yet — but here is the path.",
    body: "Borderline borrowers get a concrete, simulated route to approval: exactly which levers move the decision, and by how much.",
  },
];

const ENGINE = [
  { icon: Shield, title: "Deterministic 100-point core", body: "Six weighted factors build a capability score, minus soft penalties. Same inputs, same output — every time. No model drift." },
  { icon: Ban, title: "Hard-flag knockouts", body: "A policy breach (GST gap, active default, KYC mismatch) forces Refer / Decline regardless of score. Policy dominates." },
  { icon: Plus, title: "Bounded evidence uplift", body: "Verified operational signals can lift a borderline score by at most +10 — never enough to rescue a knockout." },
  { icon: MessageSquareText, title: "The LLM explains, never decides", body: "Language models phrase an already-final decision into plain English. They cannot compute a number or change an outcome." },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#111827]">
      <div className="mx-auto max-w-[1120px] px-8">
        {/* top brand bar */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F5E4A]">
              <Shield className="h-[18px] w-[18px] text-white" strokeWidth={1.75} />
            </span>
            <span className="text-base font-semibold tracking-tight">AEGIS</span>
          </div>
          <span className="text-xs font-medium text-[#6B7280]">MSME Credit Intelligence</span>
        </header>

        {/* hero */}
        <section className="fade-in border-t border-[#E5E7EB] pt-16 pb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1F5E4A]">Explainable credit-decision layer</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Credit decisions for the businesses a bureau score can&rsquo;t see.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#374151]">
            Aegis reads financial and alternative-data signals, produces a Financial Health Card with the evidence behind
            it, and advises the underwriter. It never auto-approves a loan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1F5E4A] px-5 py-3 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            >
              View Demo <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm text-[#6B7280]">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.75} /> Deterministic — no AI in scoring
            </span>
          </div>
        </section>

        {/* the moat */}
        <section className="border-t border-[#E5E7EB] py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">The moat</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">One layer, working in both directions.</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">
              Bureau scores miss in two directions at once. Aegis is built to correct both — and to coach the borrowers in between.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {MOAT.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ECF3F0]">
                    <Icon className="h-5 w-5 text-[#1F5E4A]" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{m.title}</h3>
                  <p className="mt-1 text-sm font-medium text-[#111827]">{m.lead}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{m.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* how the engine works */}
        <section className="border-t border-[#E5E7EB] py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">A decision you can audit line by line.</h2>
          </div>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {ENGINE.map(e => {
              const Icon = e.icon;
              return (
                <div key={e.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white">
                    <Icon className="h-[18px] w-[18px] text-[#1F5E4A]" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-tight">{e.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{e.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* closing CTA */}
        <section className="border-t border-[#E5E7EB] py-14">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-[#E5E7EB] bg-white p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">See it decide on eight real archetypes.</h2>
              <p className="mt-1.5 text-sm text-[#6B7280]">From the invisible champion to the bureau-approvable mirage — watch the evidence, not just the score.</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#1F5E4A] px-5 py-3 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            >
              View Demo <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>

        <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#E5E7EB] py-6 text-xs text-[#6B7280]">
          <span>Aegis by IDBI Innovate</span>
          <span aria-hidden>·</span>
          <span>{MODEL_VERSION}</span>
          <span aria-hidden>·</span>
          <span>Advises underwriters — does not auto-approve</span>
        </footer>
      </div>
    </main>
  );
}
