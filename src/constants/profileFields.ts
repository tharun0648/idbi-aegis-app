import type { MSMEProfile } from "@/engine/aegis-core";

export const PROFILE_FIELD_ORDER: ReadonlyArray<keyof MSMEProfile> = [
  "cashflowTrend", "gstOnTimeRate", "gstMaxGapCycles", "gstLastCycleLate",
  "digitalReceiptsShare", "digitalHistoryMonths", "yearsOperating", "avgReceivableDays",
  "topVendorShare", "seasonality", "seasonalCashDip", "activeDefault", "kycMismatch",
  "electricityTrend", "workforceTrend", "utilityPayment", "tredsHistory",
];
