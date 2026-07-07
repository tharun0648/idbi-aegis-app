import { BarChart3, TrendingDown, Equal, ShieldCheck, TrendingUp, Lock, type LucideIcon } from "lucide-react";
import type { CoreAssessment } from "@/engine/aegis-core";

/**
 * THE SCORE EQUATION — the signature element.
 * ------------------------------------------------------------------
 * A horizontal, labelled reading of how the decision score is built, straight
 * from engine fields — the UI computes nothing:
 *
 *   Capability − Soft Penalties = Net  (+ Verified Evidence = Adjusted Net)
 *
 * Conditional shape (engine-guaranteed):
 *   - hard flag present → Capability − Penalties = Net, and the flag dominates.
 *     No evidence cell, no adjusted cell (adjustedNet == net when flagged).
 *   - no flag, evidence > 0 → full five-cell equation; Adjusted Net is the decision.
 *   - no flag, no evidence → Capability − Penalties = Net; Net IS the decision
 *     (adjusted == net) — shown cleanly, with no fake +0 cell.
 */

type Tone = "default" | "deduct" | "evidence" | "decision";

interface Cell {
  key: string;
  op?: "−" | "+" | "=";
  icon: LucideIcon;
  label: string;
  sub: string;
  value: string;
  foot: string;
  tone: Tone;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function ScoreEquation({ a }: { a: CoreAssessment }) {
  const flagged = a.hardFlags.length > 0;
  const showEvidence = a.alternativeEvidenceScore > 0 && !flagged;
  const softTotal = a.penalties.reduce((s, p) => s + p.points, 0); // ≤ 0

  const cells: Cell[] = [
    { key: "cap", icon: BarChart3, label: "Capability Score", sub: "Frozen Core", value: `${a.capabilityScore}`, foot: `From ${plural(a.factors.length, "positive factor", "positive factors")}`, tone: "default" },
    { key: "pen", op: "−", icon: TrendingDown, label: "Soft Penalties", sub: "Deductions", value: `${Math.abs(softTotal)}`, foot: `From ${plural(a.penalties.length, "penalty", "penalties")}`, tone: "deduct" },
  ];

  if (showEvidence) {
    cells.push({ key: "net", op: "=", icon: Equal, label: "Net Score", sub: "Core", value: `${a.netScore}`, foot: "Core score after penalties", tone: "default" });
    cells.push({ key: "evi", op: "+", icon: ShieldCheck, label: "Verified Evidence", sub: "Additive", value: `+${a.alternativeEvidenceScore}`, foot: `From ${plural(a.altEvidence.coverageCount, "operational signal", "operational signals")}`, tone: "evidence" });
    cells.push({ key: "adj", op: "=", icon: TrendingUp, label: "Adjusted Net Score", sub: "For Decision", value: `${a.adjustedNetScore}`, foot: "Score used for decision", tone: "decision" });
  } else if (flagged) {
    cells.push({ key: "net", op: "=", icon: Equal, label: "Net Score", sub: "Core", value: `${a.netScore}`, foot: "Overridden by policy flag", tone: "default" });
  } else {
    cells.push({ key: "net", op: "=", icon: TrendingUp, label: "Net Score", sub: "For Decision", value: `${a.netScore}`, foot: "Score used for decision", tone: "decision" });
  }

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-6">
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {cells.map(cell => (
          <div key={cell.key} className="flex items-stretch gap-2">
            {cell.op && (
              <div className="flex w-6 shrink-0 items-center justify-center text-xl font-medium text-[#9CA3AF]" aria-hidden>
                {cell.op}
              </div>
            )}
            <EquationCell cell={cell} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 border-t border-[#F1F3F2] pt-4">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
        <p className="text-xs leading-relaxed text-[#6B7280]">
          Core score is frozen. Operational evidence provides a bounded uplift (max +10). Hard policy flags override all scores.
        </p>
      </div>
    </section>
  );
}

const TONE: Record<Tone, { card: string; icon: string; iconBg: string; value: string; label: string }> = {
  default:  { card: "border border-[#E5E7EB] bg-white",  icon: "#1F5E4A", iconBg: "#ECF3F0", value: "#111827", label: "#6B7280" },
  deduct:   { card: "border border-[#F0DAD6] bg-[#FBF1EF]", icon: "#B42318", iconBg: "#FBEBE9", value: "#B42318", label: "#6B7280" },
  evidence: { card: "border border-[#CDE6DC] bg-[#F1F9F5]", icon: "#1F5E4A", iconBg: "#DCEEE5", value: "#1F5E4A", label: "#4B5563" },
  decision: { card: "bg-[#123A2E]",                          icon: "#FFFFFF", iconBg: "rgba(255,255,255,0.12)", value: "#FFFFFF", label: "#A8C3B9" },
};

function EquationCell({ cell }: { cell: Cell }) {
  const t = TONE[cell.tone];
  const Icon = cell.icon;
  const onDark = cell.tone === "decision";
  return (
    <div className={`flex min-w-[168px] flex-1 flex-col rounded-lg p-4 ${t.card}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: t.iconBg }}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: t.icon }} />
      </span>
      <p className="mt-3 text-xs font-medium leading-tight" style={{ color: t.label }}>
        {cell.label}
        <span className="block font-normal opacity-80">({cell.sub})</span>
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: t.value }}>
        {cell.value}
        <span className="text-sm font-normal" style={{ color: onDark ? "#7FA99B" : "#9CA3AF" }}> / 100</span>
      </p>
      <p className="mt-1 text-[11px] leading-tight" style={{ color: onDark ? "#7FA99B" : "#9CA3AF" }}>{cell.foot}</p>
    </div>
  );
}
