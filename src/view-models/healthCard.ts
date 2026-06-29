import type { Recommendation, DecisionTrace } from "@/engine/aegis-core";

/**
 * HEALTH-CARD VIEW-MODEL — the freeze boundary.
 * ------------------------------------------------------------------
 * React renders the *decision* through this mapper, never off the raw
 * engine enum. The engine owns whether a deal is APPROVE; this file owns
 * how that reads to an underwriter (title, subtitle, colour tone).
 *
 * Freeze rule: if APPROVE later becomes APPROVE_WITH_MONITORING, only the
 * REC_VIEW table below changes — no component is touched.
 */

export type Tone = "approve" | "conditional" | "refer";

/** The Precision-Minimal palette, grouped by decision tone. */
export interface ToneTokens {
  ink: string;     // strong on-tint text
  accent: string;  // primary tone colour (numbers, arrows)
  tint: string;    // card / banner background wash
  border: string;  // tone-matched border
  line: string;    // 4px accent rule
}

export const TONES: Record<Tone, ToneTokens> = {
  approve:     { ink: "#14532D", accent: "#1D6F42", tint: "#ECF5EF", border: "#CFE6D8", line: "#1D6F42" },
  conditional: { ink: "#7C4A03", accent: "#B45309", tint: "#FEF3E2", border: "#F1DDBE", line: "#B45309" },
  refer:       { ink: "#7A2615", accent: "#B23A1E", tint: "#FBEAE5", border: "#E7C4B8", line: "#B23A1E" },
};

export interface RecommendationView {
  tone: Tone;
  colors: ToneTokens;
  title: string;
  subtitle: string;
}

const REC_VIEW: Record<Recommendation, { tone: Tone; title: string; subtitle: string }> = {
  APPROVE:           { tone: "approve",     title: "Approve",                     subtitle: "Operating strength clears the lending bar." },
  CONDITIONAL:       { tone: "conditional", title: "Approve with conditions",     subtitle: "Lend, but on terms that cover the open risks." },
  DECLINE_WITH_PATH: { tone: "conditional", title: "Not yet — clear path to yes", subtitle: "Below the line today, with a defined way up." },
  REFER_OR_DECLINE:  { tone: "refer",       title: "Refer / Decline",             subtitle: "A policy violation overrides the score." },
};

export function recommendationView(rec: Recommendation): RecommendationView {
  const v = REC_VIEW[rec];
  return { ...v, colors: TONES[v.tone] };
}

/**
 * Pick the 2–3 headline drivers for the signature bullet line.
 * Pure selection over engine-authored strings — no new copy invented.
 * Favours positive drivers (↑); fills with risk drivers (↓) up to 3.
 */
export interface Driver { direction: "up" | "down"; label: string; }

export function selectDrivers(trace: DecisionTrace, max = 3): Driver[] {
  const up: Driver[] = trace.primaryDrivers.slice(0, 2).map(label => ({ direction: "up", label }));
  const down: Driver[] = trace.riskDrivers.slice(0, max - up.length).map(label => ({ direction: "down", label }));
  return [...up, ...down];
}
