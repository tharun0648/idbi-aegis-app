import type { MSMEProfile, Lever } from "../aegis-core";

/**
 * SEED DATA — synthetic archetypes. Lives in the data layer, NOT the engine.
 * Swap this for a ULI adapter later; the engine never changes.
 */

export interface SeededBusiness {
  id: "champion" | "mirage" | "climber";
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
};

// The Climber's What-If levers (Day 3 simulator screen)
export const CLIMBER_LEVERS: Lever[] = [
  { type: "reduceReceivables", toDays: 40 },
  { type: "regularizeGst", toOnTimeRate: 0.83 },
  { type: "diversifyVendor", toShare: 22 },
];
