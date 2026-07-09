import type { LucideIcon } from "lucide-react";
import {
  LifeBuoy, ShieldAlert, TrendingUp, Shield, Ban, Plus, MessageSquareText,
  Landmark, Receipt, Droplets, FileSpreadsheet, Users, CreditCard, Building2, Smartphone,
} from "lucide-react";

/**
 * PRESENTATION METADATA — synthetic descriptive demo data ONLY.
 * ------------------------------------------------------------------
 * NONE of this is computed or scored. It is realistic chrome (turnover, GSTIN,
 * industry, etc.) so the demo reads like a real underwriting console. It lives
 * OUTSIDE the engine and OUTSIDE the frozen EnrichedAssessment contract — the
 * UI may render it, but no decision ever depends on it. See README.
 */

export interface BusinessPresentation {
  industry: string;
  location: string;
  establishedYear: number;
  annualTurnover: string; // pre-formatted display string, e.g. "₹8.4 Cr"
  gstin: string;
}

// Keyed by seed id. Plausible synthetic values chosen to fit each archetype.
export const BUSINESS_PRESENTATION: Record<string, BusinessPresentation> = {
  champion: { industry: "Manufacturing", location: "Pune, Maharashtra", establishedYear: 2018, annualTurnover: "₹8.4 Cr", gstin: "27AABCM1234F1Z5" },
  mirage:   { industry: "Wholesale Trading", location: "Surat, Gujarat", establishedYear: 2021, annualTurnover: "₹12.1 Cr", gstin: "24AACST5678G1Z2" },
  climber:  { industry: "Food Processing", location: "Coimbatore, Tamil Nadu", establishedYear: 2021, annualTurnover: "₹4.6 Cr", gstin: "33AAECN9012H1Z8" },
  prime:    { industry: "Precision Engineering", location: "Bengaluru, Karnataka", establishedYear: 2015, annualTurnover: "₹21.7 Cr", gstin: "29AAFCL3456J1Z1" },
  cusp:     { industry: "Textiles", location: "Ludhiana, Punjab", establishedYear: 2021, annualTurnover: "₹6.9 Cr", gstin: "03AAGCA7890K1Z4" },
  default:  { industry: "Logistics", location: "Nagpur, Maharashtra", establishedYear: 2019, annualTurnover: "₹15.3 Cr", gstin: "27AAHCV2345L1Z7" },
  kyc:      { industry: "Export Trading", location: "Tiruppur, Tamil Nadu", establishedYear: 2020, annualTurnover: "₹9.8 Cr", gstin: "33AAJCP6789M1Z3" },
  evidence: { industry: "Handloom & Textiles", location: "Kanchipuram, Tamil Nadu", establishedYear: 2022, annualTurnover: "₹3.2 Cr", gstin: "33AAKCK0123N1Z9" },
};

/**
 * DEMO INSIGHT — what each seeded business demonstrates about Aegis vs. a bureau
 * score, in one of three plain-language patterns. Static editorial copy, chosen
 * by hand per archetype; not derived from the engine and never scored:
 *   Rescue — bureau rejects/thin-file, Aegis approves on operational strength.
 *   Catch  — bureau reads clean/approvable, Aegis's deeper check finds (or rules
 *            out) something the bureau score can't see — including hard-flag
 *            knockouts, which sit in this bucket.
 *   Coach  — Aegis shows the specific path or terms to get from "not yet" to "yes".
 */
export type DemoLabel = "Rescue" | "Catch" | "Coach";
export interface DemoInsight { label: DemoLabel; note: string; }

export const DEMO_INSIGHT: Record<string, DemoInsight> = {
  champion: { label: "Rescue", note: "Thin file, bureau rejects; Aegis approves on operational strength." },
  mirage:   { label: "Catch",  note: "Bureau-approvable (720); Aegis catches a GST policy breach." },
  climber:  { label: "Coach",  note: "Below the line today; a simulated path to yes." },
  evidence: { label: "Rescue", note: "Thin file lifted over the line by verified operational evidence." },
  prime:    { label: "Catch",  note: "Bureau-approvable (780); Aegis's deeper check confirms zero penalties — nothing hidden." },
  cusp:     { label: "Coach",  note: "Bureau borderline (690); Aegis defines the exact terms for an approval." },
  default:  { label: "Catch",  note: "Strong surface metrics; a live default is an absolute knockout no score buys past." },
  kyc:      { label: "Catch",  note: "Bureau-approvable (710); Aegis catches a KYC identity mismatch score alone would miss." },
};

// App chrome — not per-business. Descriptive, never scored.
export const MODEL_VERSION = "Aegis core v1.2";
export const ENGINE_DESCRIPTOR = "Deterministic — No AI in scoring";
export const APP_VERSION = "1.2.0";

// Relationship-manager identity shown in the sidebar. Synthetic demo persona.
export const RELATIONSHIP_MANAGER = { name: "Rohit Mehta", role: "Relationship Manager" };

// Request-time chrome (NOT engine output). Format the moment a page renders.
export function assessmentDateLabel(now: Date = new Date()): string {
  return now.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Editorial copy shared by the landing page ("/") and the Data Sources
 * reference page ("/data-sources") — defined once here so the two pages never
 * drift out of sync. Static, descriptive, never scored.
 */
export interface MoatItem { icon: LucideIcon; title: string; lead: string; body: string; }
export const MOAT: MoatItem[] = [
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

export interface EngineHighlight { icon: LucideIcon; title: string; body: string; }
export const ENGINE: EngineHighlight[] = [
  { icon: Shield, title: "Deterministic 100-point core", body: "Six weighted factors build a capability score, minus soft penalties. Same inputs, same output — every time. No model drift." },
  { icon: Ban, title: "Hard-flag knockouts", body: "A policy breach (GST gap, active default, KYC mismatch) forces Refer / Decline regardless of score. Policy dominates." },
  { icon: Plus, title: "Bounded evidence uplift", body: "Verified operational signals can lift a borderline score by at most +10 — never enough to rescue a knockout." },
  { icon: MessageSquareText, title: "The LLM explains, never decides", body: "Language models phrase an already-final decision into plain English. They cannot compute a number or change an outcome." },
];

export interface DataEcosystemSource { icon: LucideIcon; source: string; purpose: string; signals: string[]; tag: string; }
export const DATA_ECOSYSTEM: DataEcosystemSource[] = [
  { icon: Landmark, source: "Account Aggregator", purpose: "Consented financial information", signals: ["Cash-flow trends", "Banking behaviour", "Balance consistency", "Financial stability"], tag: "Consent-based" },
  { icon: Receipt, source: "GSTN", purpose: "Business tax filing behaviour", signals: ["GST filing consistency", "Filing gaps", "Payment regularity", "Compliance history"], tag: "Government verified" },
  { icon: Droplets, source: "BBPS", purpose: "Utility payment behaviour", signals: ["Electricity payments", "Utility consistency", "Payment discipline"], tag: "Verified payment records" },
  { icon: FileSpreadsheet, source: "TReDS", purpose: "Invoice financing participation", signals: ["Invoice discounting", "Working capital usage", "Receivable behaviour"], tag: "Trade ecosystem" },
  { icon: Users, source: "EPFO / ESIC", purpose: "Employment and workforce stability", signals: ["Workforce continuity", "Contribution consistency", "Operational stability"], tag: "Operational evidence" },
  { icon: CreditCard, source: "Credit Bureau", purpose: "Traditional credit history", signals: ["Bureau score", "Existing defaults", "Delinquencies", "Credit history"], tag: "Traditional credit signal" },
  { icon: Building2, source: "MCA / UDYAM", purpose: "Business identity verification", signals: ["Entity existence", "Registration status", "Business age"], tag: "Identity verification" },
  { icon: Smartphone, source: "Digital Payments", purpose: "Business digital adoption", signals: ["Digital receipts", "Payment behaviour", "Transaction consistency"], tag: "Operational behaviour" },
];
