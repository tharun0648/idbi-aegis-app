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
