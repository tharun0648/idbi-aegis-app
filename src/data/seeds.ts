import type { MSMEProfile, Lever } from "@/engine/aegis-core";

/**
 * SEED DATA — synthetic archetypes. Lives in the data layer, NOT the engine.
 * Swap this for a ULI adapter later; the engine never changes.
 */

export interface SeededBusiness {
  id: "champion" | "mirage" | "climber" | "prime" | "cusp" | "default" | "kyc";
  businessName: string;
  archetype: string;
  emoji: string;
  bureauScore: number | null;
  bureauVerdict: "reject" | "borderline" | "approvable";
  profile: MSMEProfile;
}

export const SEEDS: Record<SeededBusiness["id"], SeededBusiness> = {
  champion: {
    id: "champion", businessName: "Meher Components", archetype: "Invisible Champion", emoji: "⭐",
    bureauScore: null, bureauVerdict: "reject",
    profile: {
      cashflowTrend: "stable", gstOnTimeRate: 0.90, gstMaxGapCycles: 0, gstLastCycleLate: false,
      digitalReceiptsShare: 0.88, digitalHistoryMonths: 5, yearsOperating: 4,
      avgReceivableDays: 32, topVendorShare: 22, seasonality: "low", seasonalCashDip: false,
      activeDefault: false, kycMismatch: false,
    },
  },
  mirage: {
    id: "mirage", businessName: "Surya Traders", archetype: "The Mirage", emoji: "⚠️",
    bureauScore: 720, bureauVerdict: "approvable",
    profile: {
      cashflowTrend: "volatile", gstOnTimeRate: 0.50, gstMaxGapCycles: 3, gstLastCycleLate: true,
      digitalReceiptsShare: 0.69, digitalHistoryMonths: 18, yearsOperating: 3,
      avgReceivableDays: 72, topVendorShare: 58, seasonality: "high", seasonalCashDip: true,
      activeDefault: false, kycMismatch: false,
    },
  },
  climber: {
    id: "climber", businessName: "Nila Foods", archetype: "The Climber", emoji: "📈",
    bureauScore: null, bureauVerdict: "borderline",
    profile: {
      cashflowTrend: "improving", gstOnTimeRate: 0.67, gstMaxGapCycles: 1, gstLastCycleLate: true,
      digitalReceiptsShare: 0.75, digitalHistoryMonths: 14, yearsOperating: 3,
      avgReceivableDays: 60, topVendorShare: 34, seasonality: "moderate", seasonalCashDip: false,
      activeDefault: false, kycMismatch: false,
    },
  },

  // ── Gap-filling seeds: purposeful coverage of the uncovered decision space ──

  // Clean, high-confidence APPROVE with zero penalties and no flags.
  prime: {
    id: "prime", businessName: "Lakshmi Engineering", archetype: "Prime Performer", emoji: "🏆",
    bureauScore: 780, bureauVerdict: "approvable",
    profile: {
      cashflowTrend: "growing", gstOnTimeRate: 0.98, gstMaxGapCycles: 0, gstLastCycleLate: false,
      digitalReceiptsShare: 0.9, digitalHistoryMonths: 24, yearsOperating: 6,
      avgReceivableDays: 28, topVendorShare: 18, seasonality: "low", seasonalCashDip: false,
      activeDefault: false, kycMismatch: false,
    },
  },

  // CONDITIONAL band (net 50–59): strengths present but soft risks need terms.
  cusp: {
    id: "cusp", businessName: "Anil Textiles", archetype: "On the Cusp", emoji: "⚖️",
    bureauScore: 690, bureauVerdict: "borderline",
    profile: {
      cashflowTrend: "volatile", gstOnTimeRate: 0.6, gstMaxGapCycles: 1, gstLastCycleLate: false,
      digitalReceiptsShare: 0.55, digitalHistoryMonths: 10, yearsOperating: 3,
      avgReceivableDays: 52, topVendorShare: 24, seasonality: "moderate", seasonalCashDip: false,
      activeDefault: false, kycMismatch: false,
    },
  },

  // ACTIVE_DEFAULT hard-flag knockout — strong surface, but a live default overrides.
  default: {
    id: "default", businessName: "Vikram Logistics", archetype: "Overextended", emoji: "🚩",
    bureauScore: 640, bureauVerdict: "reject",
    profile: {
      cashflowTrend: "stable", gstOnTimeRate: 0.88, gstMaxGapCycles: 0, gstLastCycleLate: false,
      digitalReceiptsShare: 0.8, digitalHistoryMonths: 20, yearsOperating: 5,
      avgReceivableDays: 38, topVendorShare: 20, seasonality: "low", seasonalCashDip: false,
      activeDefault: true, kycMismatch: false,
    },
  },

  // KYC_MISMATCH hard-flag knockout — identity inconsistency overrides the score.
  kyc: {
    id: "kyc", businessName: "Priya Exports", archetype: "Identity Gap", emoji: "🔍",
    bureauScore: 710, bureauVerdict: "approvable",
    profile: {
      cashflowTrend: "improving", gstOnTimeRate: 0.92, gstMaxGapCycles: 0, gstLastCycleLate: false,
      digitalReceiptsShare: 0.78, digitalHistoryMonths: 16, yearsOperating: 4,
      avgReceivableDays: 35, topVendorShare: 22, seasonality: "low", seasonalCashDip: false,
      activeDefault: false, kycMismatch: true,
    },
  },
};

// The Climber's What-If levers (Day 3 simulator screen)
export const CLIMBER_LEVERS: Lever[] = [
  { type: "reduceReceivables", toDays: 40 },
  { type: "regularizeGst", toOnTimeRate: 0.83 },
  { type: "diversifyVendor", toShare: 22 },
];
