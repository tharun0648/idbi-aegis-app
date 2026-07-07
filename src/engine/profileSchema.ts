import { z } from "zod";
import type { MSMEProfile } from "@/engine/aegis-core";

/**
 * PROFILE SCHEMA — validation at the boundary.
 * ------------------------------------------------------------------
 * The engine (aegis-core.ts) stays pure and import-free: it trusts its
 * input. This file is where untrusted input (a form post, an API body)
 * is checked against the MSMEProfile contract BEFORE it ever reaches
 * assess(). Reject NaN/Infinity, enforce ranges and units, hand back
 * human-readable per-field errors. No coercion — garbage is rejected,
 * never silently rounded into a false APPROVE.
 *
 * Note the units, they differ on purpose:
 *   gstOnTimeRate, digitalReceiptsShare → ratio 0..1
 *   topVendorShare                      → percent 0..100  (NOT a ratio)
 */

// Every number must be finite (rejects NaN and ±Infinity) regardless of bounds.
const ratio = (label: string) =>
  z
    .number({ error: `${label} must be a number between 0 and 1.` })
    .refine(Number.isFinite, { error: `${label} must be a finite number.` })
    .refine((n) => n >= 0 && n <= 1, { error: `${label} must be between 0 and 1.` });

const percent = (label: string) =>
  z
    .number({ error: `${label} must be a number between 0 and 100.` })
    .refine(Number.isFinite, { error: `${label} must be a finite number.` })
    .refine((n) => n >= 0 && n <= 100, { error: `${label} must be between 0 and 100 (a percent, not a ratio).` });

const nonNegative = (label: string, unit: string) =>
  z
    .number({ error: `${label} must be a number of ${unit}.` })
    .refine(Number.isFinite, { error: `${label} must be a finite number of ${unit}.` })
    .refine((n) => n >= 0, { error: `${label} must be 0 or greater.` });

const countInt = (label: string) =>
  z
    .number({ error: `${label} must be a whole number.` })
    .refine(Number.isFinite, { error: `${label} must be a finite whole number.` })
    .refine(Number.isInteger, { error: `${label} must be a whole number (no decimals).` })
    .refine((n) => n >= 0, { error: `${label} must be 0 or greater.` });

const flag = (label: string) => z.boolean({ error: `${label} must be true or false.` });

export const profileSchema = z.object({
  cashflowTrend: z.enum(["declining", "volatile", "improving", "stable", "growing"], {
    error: "Cash-flow trend must be one of: declining, volatile, improving, stable, growing.",
  }),
  gstOnTimeRate: ratio("GST on-time rate"),
  gstMaxGapCycles: countInt("GST max gap cycles"),
  gstLastCycleLate: flag("GST last cycle late"),
  digitalReceiptsShare: ratio("Digital receipts share"),
  digitalHistoryMonths: nonNegative("Digital history", "months"),
  yearsOperating: nonNegative("Years operating", "years"),
  avgReceivableDays: nonNegative("Average receivable days", "days"),
  topVendorShare: percent("Top vendor share"),
  seasonality: z.enum(["low", "moderate", "high", "severe"], {
    error: "Seasonality must be one of: low, moderate, high, severe.",
  }),
  seasonalCashDip: flag("Seasonal cash dip"),
  activeDefault: flag("Active default"),
  kycMismatch: flag("KYC mismatch"),

  // Alternative operational evidence — all OPTIONAL (absent = "not available",
  // 0 contribution). Only a provided-but-invalid value is rejected.
  electricityTrend: z
    .enum(["declining", "stable", "growing"], { error: "Electricity trend must be one of: declining, stable, growing." })
    .optional(),
  workforceTrend: z
    .enum(["declining", "stable", "growing"], { error: "Workforce trend must be one of: declining, stable, growing." })
    .optional(),
  utilityPayment: z
    .enum(["irregular", "mostly_on_time", "always_on_time"], { error: "Utility payment must be one of: irregular, mostly_on_time, always_on_time." })
    .optional(),
  tredsHistory: z
    .enum(["none", "limited", "active"], { error: "TReDS history must be one of: none, limited, active." })
    .optional(),
});

export type ParsedProfile = z.infer<typeof profileSchema>;

// Compile-time proof the schema's output matches the engine contract exactly.
// (Both directions: the engine type must satisfy the schema output, and the
// schema output must satisfy the engine type — validateProfile returns MSMEProfile.)
const _contract: ParsedProfile = {} as MSMEProfile;
const _contractReverse: MSMEProfile = {} as ParsedProfile;
void _contract;
void _contractReverse;

export type ValidationResult =
  | { ok: true; profile: MSMEProfile }
  | { ok: false; errors: Record<string, string> };

/**
 * Validate an untrusted input against the MSMEProfile contract.
 * On success → the parsed, typed profile. On failure → one human-readable
 * message per offending field (keyed by field name; `_form` for shape errors).
 */
export function validateProfile(input: unknown): ValidationResult {
  const result = profileSchema.safeParse(input);
  if (result.success) return { ok: true, profile: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    if (!(key in errors)) errors[key] = issue.message; // first message per field wins
  }
  return { ok: false, errors };
}

/** A sensible mid-range profile so the input form isn't tedious to start from. */
export const EXAMPLE_DEFAULT_PROFILE: MSMEProfile = {
  cashflowTrend: "stable",
  gstOnTimeRate: 0.85,
  gstMaxGapCycles: 0,
  gstLastCycleLate: false,
  digitalReceiptsShare: 0.7,
  digitalHistoryMonths: 12,
  yearsOperating: 4,
  avgReceivableDays: 40,
  topVendorShare: 25,
  seasonality: "low",
  seasonalCashDip: false,
  activeDefault: false,
  kycMismatch: false,
};
