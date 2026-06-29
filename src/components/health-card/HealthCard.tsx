import type { EnrichedAssessment } from "@/engine/assessmentAdapter";
import type { Recommendation } from "@/engine/aegis-core";

/** The flagship screen. Renders only from the contract — no business logic here. */

const REC_META: Record<Recommendation, { label: string; fg: string; bg: string; bar: string }> = {
  APPROVE:            { label: "Approve",                         fg: "#14532D", bg: "#ECF5EF", bar: "#1D6F42" },
  CONDITIONAL:        { label: "Approve with conditions",         fg: "#7C4A03", bg: "#FEF3E2", bar: "#B45309" },
  DECLINE_WITH_PATH:  { label: "Not yet — improvement path open", fg: "#7C4A03", bg: "#FEF3E2", bar: "#B45309" },
  REFER_OR_DECLINE:   { label: "Refer / Decline",                 fg: "#7A2615", bg: "#FBEAE5", bar: "#B23A1E" },
};

const bureauLabel: Record<string, string> = { reject: "Reject", borderline: "Borderline", approvable: "Approvable" };

export default function HealthCard({ a }: { a: EnrichedAssessment }) {
  const rec = REC_META[a.recommendation];
  return (
    <article className="mx-auto max-w-2xl">
      {/* header */}
      <header className="mb-5">
        <div className="flex items-center gap-2 text-sm text-[#57534E]">
          <span>{a.business.emoji}</span>
          <span className="rounded-md bg-[#F5F5F4] px-2 py-0.5 font-medium text-[#44403C]">{a.business.archetype}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1C1917]">{a.business.businessName}</h1>
        <p className="mt-1 text-sm text-[#78716C]">
          Bureau: {bureauLabel[a.business.bureauVerdict] ?? a.business.bureauVerdict}
          {a.business.bureauScore === null ? " — thin / no file" : ` (${a.business.bureauScore})`}
        </p>
      </header>

      {/* recommendation */}
      <section className="rounded-lg border border-[#E7E5E4]" style={{ borderLeft: `4px solid ${rec.bar}` }}>
        <div className="flex items-center justify-between gap-4 p-5" style={{ background: rec.bg }}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Aegis recommendation</p>
            <p className="mt-1 text-xl font-semibold" style={{ color: rec.fg }}>{rec.label}</p>
            <p className="mt-1 text-xs text-[#78716C]">Decision confidence: {a.decisionConfidence.band} ({a.decisionConfidence.score})</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Health score</p>
            <p className="text-4xl font-semibold tabular-nums" style={{ color: rec.fg }}>{a.netScore}</p>
            <p className="text-xs text-[#78716C] tabular-nums">{a.capabilityScore} capability − {a.capabilityScore - a.netScore} risk</p>
          </div>
        </div>
      </section>

      {/* policy flags — the Mirage moment */}
      {a.hardFlags.length > 0 && (
        <section className="mt-4 rounded-lg border border-[#E7C4B8] bg-[#FBEAE5] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7A2615]">Policy violations · override the score</p>
          <ul className="mt-2 space-y-1">
            {a.hardFlags.map(f => (
              <li key={f.code} className="text-sm text-[#7A2615]"><span className="font-medium">{f.label}</span> — {f.basis}</li>
            ))}
          </ul>
        </section>
      )}

      {/* decision rationale — from the deterministic trace */}
      <section className="mt-4 rounded-lg border border-[#E7E5E4] bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Decision rationale</h2>
        <p className="mt-2 text-sm text-[#44403C]">{a.decisionTrace.decisionReason}</p>
        {a.decisionTrace.primaryDrivers.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-[#A8A29E]">Supporting evidence</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {a.decisionTrace.primaryDrivers.map(d => (
                <span key={d} className="rounded-md bg-[#ECF5EF] px-2 py-0.5 text-xs font-medium text-[#14532D]">{d}</span>
              ))}
            </div>
          </div>
        )}
        {a.decisionTrace.riskDrivers.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-[#A8A29E]">Risk drivers</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {a.decisionTrace.riskDrivers.map(d => (
                <span key={d} className="rounded-md bg-[#FBEAE5] px-2 py-0.5 text-xs font-medium text-[#7A2615]">{d}</span>
              ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-[#A8A29E]">{a.decisionConfidence.reason}</p>
      </section>

      {/* factors */}
      <section className="mt-4 rounded-lg border border-[#E7E5E4] bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Financial health factors</h2>
        <ul className="mt-3 space-y-3">
          {a.factors.map(f => (
            <li key={f.name}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-[#1C1917]">{f.name}</span>
                <span className="text-sm tabular-nums text-[#57534E]">{f.value}<span className="text-[#A8A29E]">/{f.max}</span></span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F5F5F4]">
                <div className="h-full rounded-full bg-[#1D6F42]" style={{ width: `${(f.value / f.max) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-[#A8A29E]">{f.basis}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* penalties */}
      {a.penalties.length > 0 && (
        <section className="mt-4 rounded-lg border border-[#E7E5E4] bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Risk deductions</h2>
          <ul className="mt-3 space-y-2">
            {a.penalties.map(p => (
              <li key={p.name} className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-[#1C1917]">{p.name} <span className="text-[#A8A29E]">— {p.basis}</span></span>
                <span className="text-sm font-medium tabular-nums text-[#B23A1E]">{p.points}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {a.businessNarrative && (
        <section className="mt-4 rounded-lg border border-[#E7E5E4] bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Summary</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#44403C]">{a.businessNarrative}</p>
        </section>
      )}
    </article>
  );
}
