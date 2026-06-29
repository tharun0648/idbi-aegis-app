/**
 * AEGIS CORE — pure, deterministic credit-decision engine.
 * ------------------------------------------------------------------
 * Treat this file like a public API: changes are rare, deliberate, and
 * reviewed against ONE question — "does this improve the lending model,
 * or is it compensating for a UI problem?" If the latter, fix the UI.
 *
 * NO LLM. NO HTTP. NO IDs. NO persistence. It takes a profile, returns
 * a CoreAssessment. Everything credit-related is deterministic and here.
 *
 *   MSMEProfile -> factors -> scoring -> policy -> decision -> CoreAssessment
 *
 * The service layer owns seeds, lookup, narration, caching, auth, ULI.
 */

// ── 1. INPUT CONTRACT ────────────────────────────────────────────────
export type CashflowTrend = "declining" | "volatile" | "improving" | "stable" | "growing";
export type SeasonalityBand = "low" | "moderate" | "high" | "severe";

export interface MSMEProfile {
  cashflowTrend: CashflowTrend;
  gstOnTimeRate: number;          // 0..1
  gstMaxGapCycles: number;        // longest run of missed filings
  gstLastCycleLate: boolean;
  digitalReceiptsShare: number;   // 0..1
  digitalHistoryMonths: number;
  yearsOperating: number;
  avgReceivableDays: number;
  topVendorShare: number;         // % from largest buyer
  seasonality: SeasonalityBand;
  seasonalCashDip: boolean;
  activeDefault: boolean;
  kycMismatch: boolean;
}

// ── 2. FACTOR ENGINE (basis string IS the explanation) ───────────────
export interface Factor { name: string; value: number; max: number; basis: string; }

const FACTOR_MAX = { cashFlow: 20, gst: 18, digital: 16, business: 16, invoice: 16, seasonality: 14 } as const;

const CASHFLOW_MAP: Record<CashflowTrend, number> = { declining: 4, volatile: 10, improving: 14, stable: 18, growing: 20 };
const SEASONALITY_MAP: Record<SeasonalityBand, number> = { low: 14, moderate: 10, high: 6, severe: 3 };
const yearsBand = (y: number) => (y >= 5 ? 16 : y >= 4 ? 14 : y >= 3 ? 11 : y >= 2 ? 8 : y >= 1 ? 5 : 2);
const invoiceBand = (d: number) => (d <= 30 ? 16 : d <= 40 ? 13 : d <= 50 ? 10 : d <= 60 ? 7 : d <= 75 ? 4 : 2);

export function deriveFactors(b: MSMEProfile): Factor[] {
  return [
    { name: "Cash-Flow Stability", value: CASHFLOW_MAP[b.cashflowTrend], max: FACTOR_MAX.cashFlow, basis: `Inflow trend is ${b.cashflowTrend}.` },
    { name: "GST Consistency", value: Math.round(b.gstOnTimeRate * FACTOR_MAX.gst), max: FACTOR_MAX.gst, basis: `Filed on time in ${Math.round(b.gstOnTimeRate * 100)}% of recent cycles.` },
    { name: "Digital Receipts", value: Math.round(b.digitalReceiptsShare * FACTOR_MAX.digital), max: FACTOR_MAX.digital, basis: `${Math.round(b.digitalReceiptsShare * 100)}% of receipts are digital.` },
    { name: "Business Stability", value: yearsBand(b.yearsOperating), max: FACTOR_MAX.business, basis: `${b.yearsOperating} years operating.` },
    { name: "Invoice Health", value: invoiceBand(b.avgReceivableDays), max: FACTOR_MAX.invoice, basis: `Average receivables ${b.avgReceivableDays} days.` },
    { name: "Seasonality", value: SEASONALITY_MAP[b.seasonality], max: FACTOR_MAX.seasonality, basis: `Seasonality is ${b.seasonality}.` },
  ];
}

// ── 3. RISK ENGINE — two tiers ───────────────────────────────────────
export interface Penalty { name: string; points: number; basis: string; }
export interface HardFlag { code: string; label: string; basis: string; }

export function hardFlags(b: MSMEProfile): HardFlag[] {
  const f: HardFlag[] = [];
  if (b.gstMaxGapCycles >= 2) f.push({ code: "GST_FILING_GAP", label: "GST filing gap", basis: `${b.gstMaxGapCycles} consecutive cycles missed.` });
  if (b.activeDefault) f.push({ code: "ACTIVE_DEFAULT", label: "Active default", basis: "Active overdue/default signal." });
  if (b.kycMismatch) f.push({ code: "KYC_FRAUD", label: "KYC mismatch", basis: "Identity/KYC inconsistency." });
  return f;
}

export function softPenalties(b: MSMEProfile, flags: HardFlag[]): Penalty[] {
  const p: Penalty[] = [];
  const hasGstFlag = flags.some(f => f.code === "GST_FILING_GAP");

  if (b.avgReceivableDays > 55) p.push({ name: "Slow receivables", points: -7, basis: `Receivables at ${b.avgReceivableDays} days.` });
  else if (b.avgReceivableDays > 45) p.push({ name: "Elevated receivables", points: -3, basis: `Receivables at ${b.avgReceivableDays} days.` });

  if (b.topVendorShare > 40) p.push({ name: "Vendor concentration", points: -10, basis: `${b.topVendorShare}% revenue from one buyer.` });
  else if (b.topVendorShare > 30) p.push({ name: "Vendor concentration", points: -6, basis: `${b.topVendorShare}% revenue from one buyer.` });
  else if (b.topVendorShare > 20) p.push({ name: "Vendor concentration", points: -3, basis: `${b.topVendorShare}% revenue from one buyer.` });

  // Suppress GST soft penalty when the hard flag already captures it (no double-count)
  if (b.gstLastCycleLate && !hasGstFlag) p.push({ name: "Recent late GST", points: -5, basis: "Most recent GST cycle filed late." });
  if (b.seasonalCashDip) p.push({ name: "Seasonal cash dip", points: -5, basis: "Material seasonal cash gap." });
  if (b.digitalHistoryMonths < 6) p.push({ name: "Short digital history", points: -4, basis: `Only ${b.digitalHistoryMonths} months of digital history.` });
  return p;
}

// ── 4. DECISION + CONFIDENCE (both deterministic) ────────────────────
export type Recommendation = "APPROVE" | "CONDITIONAL" | "DECLINE_WITH_PATH" | "REFER_OR_DECLINE";
export interface DecisionConfidence { score: number; band: "High" | "Medium" | "Low"; reason: string; }

const APPROVE_LINE = 60;
const CONDITIONAL_LINE = 50;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function decide(netScore: number, flags: HardFlag[]): Recommendation {
  if (flags.length > 0) return "REFER_OR_DECLINE";
  if (netScore >= APPROVE_LINE) return "APPROVE";
  if (netScore >= CONDITIONAL_LINE) return "CONDITIONAL";
  return "DECLINE_WITH_PATH";
}

function decisionConfidence(b: MSMEProfile, netScore: number, rec: Recommendation, flags: HardFlag[]): DecisionConfidence {
  let base: number;
  let marginReason: string;
  if (flags.length > 0) {
    base = 85; marginReason = "A policy violation makes the call clear-cut.";
  } else if (rec === "APPROVE") {
    base = clamp(50 + 3 * (netScore - APPROVE_LINE), 30, 98);
    marginReason = netScore - APPROVE_LINE >= 8 ? "Net score sits comfortably above the approval line." : "Net score sits just above the approval line.";
  } else if (rec === "DECLINE_WITH_PATH") {
    base = clamp(50 + 3 * (CONDITIONAL_LINE - netScore), 30, 98);
    marginReason = CONDITIONAL_LINE - netScore >= 8 ? "Net score sits well below the approval line." : "Net score sits just below the line; small changes flip the outcome.";
  } else {
    base = clamp(50 + 3 * Math.min(netScore - CONDITIONAL_LINE, APPROVE_LINE - netScore), 30, 98);
    marginReason = "Net score sits between thresholds; the decision is marginal.";
  }
  const completeness = (b.digitalHistoryMonths < 6 ? 8 : 0) + (b.yearsOperating < 2 ? 6 : 0);
  const score = Math.round(clamp(base - completeness, 0, 100));
  const reason = completeness > 0 ? `${marginReason} Limited operating history slightly lowers certainty.` : marginReason;
  return { score, band: score >= 75 ? "High" : score >= 55 ? "Medium" : "Low", reason };
}

// ── DecisionTrace — structured "why", deterministic. The narrator phrases it. ──
export interface DecisionTrace { primaryDrivers: string[]; riskDrivers: string[]; decisionReason: string; }

const DECISION_REASON: Record<Recommendation, string> = {
  APPROVE: "Approved: positive operating signals outweigh manageable risk.",
  CONDITIONAL: "Approvable with conditions: strengths are present but risks need terms.",
  DECLINE_WITH_PATH: "Not yet approvable: risk deductions pull the score below the line, but a clear improvement path exists.",
  REFER_OR_DECLINE: "Refer/decline: a policy violation overrides positive operating signals.",
};

function buildTrace(factors: Factor[], penalties: Penalty[], flags: HardFlag[], rec: Recommendation): DecisionTrace {
  return {
    primaryDrivers: factors.filter(f => f.value / f.max >= 0.7).map(f => f.name),
    riskDrivers: [...flags.map(f => f.label), ...penalties.map(p => p.name)],
    decisionReason: DECISION_REASON[rec],
  };
}

// ── 5. CORE ASSESSMENT (pure engine output) ──────────────────────────
export interface ImprovementStep {
  action: string;
  lever: Lever | null;            // null = advisory (e.g. clear a hard flag)
  delta: number;                  // projected net change (0 for advisory)
  projectedNet: number;
  projectedRecommendation: Recommendation;
}

export interface CoreAssessment {
  factors: Factor[];
  penalties: Penalty[];
  hardFlags: HardFlag[];
  capabilityScore: number;
  netScore: number;
  recommendation: Recommendation;
  decisionConfidence: DecisionConfidence;
  decisionTrace: DecisionTrace;
  improvementPlan: ImprovementStep[];
}

export function assess(b: MSMEProfile): CoreAssessment {
  const factors = deriveFactors(b);
  const flags = hardFlags(b);
  const penalties = softPenalties(b, flags);
  const capabilityScore = factors.reduce((s, f) => s + f.value, 0);
  const netScore = capabilityScore + penalties.reduce((s, p) => s + p.points, 0);
  const recommendation = decide(netScore, flags);

  return {
    factors, penalties, hardFlags: flags, capabilityScore, netScore, recommendation,
    decisionConfidence: decisionConfidence(b, netScore, recommendation, flags),
    decisionTrace: buildTrace(factors, penalties, flags, recommendation),
    improvementPlan: buildImprovementPlan(b),
  };
}

// ── 6. SIMULATOR — levers move RAW inputs, then re-assess ────────────
export type Lever =
  | { type: "reduceReceivables"; toDays: number }
  | { type: "regularizeGst"; toOnTimeRate: number }
  | { type: "diversifyVendor"; toShare: number };

export function applyLevers(b: MSMEProfile, levers: Lever[]): MSMEProfile {
  const next = { ...b };
  for (const l of levers) {
    if (l.type === "reduceReceivables") next.avgReceivableDays = l.toDays;
    if (l.type === "regularizeGst") { next.gstOnTimeRate = l.toOnTimeRate; next.gstLastCycleLate = false; }
    if (l.type === "diversifyVendor") next.topVendorShare = l.toShare;
  }
  return next;
}

export const simulate = (b: MSMEProfile, levers: Lever[]): CoreAssessment => assess(applyLevers(b, levers));

// ── 7. IMPROVEMENT PLAN (deterministic content; LLM only phrases it) ─
function buildImprovementPlan(b: MSMEProfile): ImprovementStep[] {
  const current = { netScore: deriveFactors(b).reduce((s, f) => s + f.value, 0) + softPenalties(b, hardFlags(b)).reduce((s, p) => s + p.points, 0) };
  const steps: ImprovementStep[] = [];

  for (const f of hardFlags(b)) {
    steps.push({ action: `Resolve ${f.label} (${f.basis})`, lever: null, delta: 0, projectedNet: current.netScore, projectedRecommendation: "REFER_OR_DECLINE" });
  }

  const candidates: Lever[] = [];
  if (b.avgReceivableDays > 45) candidates.push({ type: "reduceReceivables", toDays: 40 });
  if (b.gstLastCycleLate && b.gstMaxGapCycles < 2) candidates.push({ type: "regularizeGst", toOnTimeRate: 0.9 });
  if (b.topVendorShare > 20) candidates.push({ type: "diversifyVendor", toShare: 20 });

  for (const lever of candidates) {
    const projected = simulate(b, [lever]);
    steps.push({
      action: describeLever(lever),
      lever,
      delta: projected.netScore - current.netScore,
      projectedNet: projected.netScore,
      projectedRecommendation: projected.recommendation,
    });
  }
  return steps.sort((a, z) => z.delta - a.delta);
}

function describeLever(l: Lever): string {
  if (l.type === "reduceReceivables") return `Reduce average receivables to ${l.toDays} days`;
  if (l.type === "regularizeGst") return `File GST on time (raise to ${Math.round(l.toOnTimeRate * 100)}%)`;
  return `Reduce largest-buyer share to ${l.toShare}%`;
}
