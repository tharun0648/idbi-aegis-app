/**
 * ALTERNATIVE EVIDENCE LAYER — pure, bounded, additive.
 * ------------------------------------------------------------------
 * A PLUG-IN on top of the frozen 100-point core (aegis-core.ts). It never
 * touches factor weights, penalties, or hard flags. It reads four OPTIONAL
 * operational signals and returns a small, hard-capped positive contribution
 * that can only ever RAISE a borderline score — never lower it, never rescue
 * a hard-flagged profile (the caller suppresses it in that case).
 *
 * Invariants:
 *   - Absent signal        → 0 contribution (fields are optional).
 *   - Per-signal floor      = 0 (declining / irregular / none never subtract).
 *   - Total hard cap        = +10.
 *   NO LLM. NO IO. Deterministic. Same shape of purity as the core.
 */

import type { MSMEProfile } from "@/engine/aegis-core";

export interface AltSignalContribution {
  signal: string;        // human-readable label (shown in the evidence section)
  value: string;         // the observed value, or "Not available"
  contribution: number;  // points added, always >= 0
}

export interface AltEvidence {
  points: number;                       // total, floored at 0 per signal, capped at +10
  breakdown: AltSignalContribution[];   // one row per signal (present or not)
  coverageCount: number;                // how many of the four signals are provided
}

export const ALT_EVIDENCE_CAP = 10;

// Full / Partial / 0 scales. Absent (undefined) resolves to 0 via the lookups below.
const ELECTRICITY: Record<NonNullable<MSMEProfile["electricityTrend"]>, number> = { growing: 3, stable: 2, declining: 0 };
const WORKFORCE:   Record<NonNullable<MSMEProfile["workforceTrend"]>, number>   = { growing: 2, stable: 1, declining: 0 };
const BBPS:        Record<NonNullable<MSMEProfile["utilityPayment"]>, number>   = { always_on_time: 3, mostly_on_time: 2, irregular: 0 };
const TREDS:       Record<NonNullable<MSMEProfile["tredsHistory"]>, number>     = { active: 2, limited: 1, none: 0 };

const humanize = (v: string | undefined) =>
  v === undefined ? "Not available" : v.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());

export function computeAltEvidence(p: MSMEProfile): AltEvidence {
  const rows: AltSignalContribution[] = [
    { signal: "Electricity usage trend",   value: humanize(p.electricityTrend), contribution: p.electricityTrend ? ELECTRICITY[p.electricityTrend] : 0 },
    { signal: "Workforce trend",           value: humanize(p.workforceTrend),   contribution: p.workforceTrend   ? WORKFORCE[p.workforceTrend]     : 0 },
    { signal: "Utility bill payments",      value: humanize(p.utilityPayment),   contribution: p.utilityPayment   ? BBPS[p.utilityPayment]          : 0 },
    { signal: "TReDS invoice financing",    value: humanize(p.tredsHistory),     contribution: p.tredsHistory     ? TREDS[p.tredsHistory]           : 0 },
  ];

  const raw = rows.reduce((s, r) => s + r.contribution, 0);   // each term already >= 0 (floor)
  const points = Math.min(raw, ALT_EVIDENCE_CAP);             // hard cap at +10
  const coverageCount = [p.electricityTrend, p.workforceTrend, p.utilityPayment, p.tredsHistory].filter(v => v !== undefined).length;

  return { points, breakdown: rows, coverageCount };
}
