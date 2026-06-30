"use client";

import { useState } from "react";
import { validateProfile, EXAMPLE_DEFAULT_PROFILE } from "@/engine/profileSchema";
import { SEEDS, type SeededBusiness } from "@/data/seeds";
import type { MSMEProfile } from "@/engine/aegis-core";
import type { EnrichedAssessment } from "@/engine/assessmentAdapter";
import HealthCard from "@/components/health-card/HealthCard";

/**
 * The public input surface. Holds 13 form fields as the one place client
 * state is allowed for ad-hoc profiles, validates at the boundary
 * (validateProfile), and on success posts to /api/assess and renders the
 * SAME Health Card with the live engine result. No scoring lives here.
 */

type NumberKey =
  | "gstOnTimeRate"
  | "gstMaxGapCycles"
  | "digitalReceiptsShare"
  | "digitalHistoryMonths"
  | "yearsOperating"
  | "avgReceivableDays"
  | "topVendorShare";

const NUMBER_FIELDS: ReadonlyArray<{ key: NumberKey; label: string; unit: string; step: number }> = [
  { key: "gstOnTimeRate", label: "GST on-time rate", unit: "ratio 0–1", step: 0.01 },
  { key: "gstMaxGapCycles", label: "GST max gap cycles", unit: "count, integer ≥ 0", step: 1 },
  { key: "digitalReceiptsShare", label: "Digital receipts share", unit: "ratio 0–1", step: 0.01 },
  { key: "digitalHistoryMonths", label: "Digital history", unit: "months ≥ 0", step: 1 },
  { key: "yearsOperating", label: "Years operating", unit: "years ≥ 0", step: 0.5 },
  { key: "avgReceivableDays", label: "Avg receivable days", unit: "days ≥ 0", step: 1 },
  { key: "topVendorShare", label: "Top vendor share", unit: "percent 0–100", step: 1 },
];

const CASHFLOW_OPTIONS = ["declining", "volatile", "improving", "stable", "growing"] as const;
const SEASONALITY_OPTIONS = ["low", "moderate", "high", "severe"] as const;

const BOOL_FIELDS: ReadonlyArray<{ key: "gstLastCycleLate" | "seasonalCashDip" | "activeDefault" | "kycMismatch"; label: string; hint: string }> = [
  { key: "gstLastCycleLate", label: "GST last cycle late", hint: "Most recent filing was late" },
  { key: "seasonalCashDip", label: "Seasonal cash dip", hint: "Material seasonal cash gap" },
  { key: "activeDefault", label: "Active default", hint: "Live overdue / default — hard flag" },
  { key: "kycMismatch", label: "KYC mismatch", hint: "Identity inconsistency — hard flag" },
];

type FormState = {
  cashflowTrend: string;
  gstOnTimeRate: string;
  gstMaxGapCycles: string;
  gstLastCycleLate: boolean;
  digitalReceiptsShare: string;
  digitalHistoryMonths: string;
  yearsOperating: string;
  avgReceivableDays: string;
  topVendorShare: string;
  seasonality: string;
  seasonalCashDip: boolean;
  activeDefault: boolean;
  kycMismatch: boolean;
};

function fromProfile(p: MSMEProfile): FormState {
  return {
    cashflowTrend: p.cashflowTrend,
    gstOnTimeRate: String(p.gstOnTimeRate),
    gstMaxGapCycles: String(p.gstMaxGapCycles),
    gstLastCycleLate: p.gstLastCycleLate,
    digitalReceiptsShare: String(p.digitalReceiptsShare),
    digitalHistoryMonths: String(p.digitalHistoryMonths),
    yearsOperating: String(p.yearsOperating),
    avgReceivableDays: String(p.avgReceivableDays),
    topVendorShare: String(p.topVendorShare),
    seasonality: p.seasonality,
    seasonalCashDip: p.seasonalCashDip,
    activeDefault: p.activeDefault,
    kycMismatch: p.kycMismatch,
  };
}

// Empty string → NaN (not 0) so blank fields are rejected by validateProfile.
const toNum = (s: string) => (s.trim() === "" ? NaN : Number(s));

function toRaw(f: FormState): Record<string, unknown> {
  return {
    cashflowTrend: f.cashflowTrend,
    gstOnTimeRate: toNum(f.gstOnTimeRate),
    gstMaxGapCycles: toNum(f.gstMaxGapCycles),
    gstLastCycleLate: f.gstLastCycleLate,
    digitalReceiptsShare: toNum(f.digitalReceiptsShare),
    digitalHistoryMonths: toNum(f.digitalHistoryMonths),
    yearsOperating: toNum(f.yearsOperating),
    avgReceivableDays: toNum(f.avgReceivableDays),
    topVendorShare: toNum(f.topVendorShare),
    seasonality: f.seasonality,
    seasonalCashDip: f.seasonalCashDip,
    activeDefault: f.activeDefault,
    kycMismatch: f.kycMismatch,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const EXAMPLES: SeededBusiness[] = Object.values(SEEDS);

export default function ProfileForm() {
  const [form, setForm] = useState<FormState>(() => fromProfile(EXAMPLE_DEFAULT_PROFILE));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EnrichedAssessment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const loadExample = (p: MSMEProfile) => {
    setForm(fromProfile(p));
    setErrors({});
    setFormError(null);
    setResult(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Validate at the boundary. If invalid, show inline errors — engine is NOT called.
    const validation = validateProfile(toRaw(form));
    if (!validation.ok) {
      setErrors(validation.errors);
      setResult(null);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.profile),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors(data.errors ?? {});
        setFormError(data.errors ? null : "Something went wrong assessing this profile.");
        setResult(null);
        return;
      }
      setResult(data.assessment as EnrichedAssessment);
    } catch {
      setFormError("Couldn't reach the assessment service.");
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-[#1C1917] outline-none focus:border-[#1D6F42] focus:ring-2 focus:ring-[#1D6F42]/15";

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Load example */}
        <section className="rounded-lg border border-[#E7E5E4] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Start from a known case</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => loadExample(b.profile)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E7E5E4] bg-white px-3 py-1.5 text-sm text-[#44403C] transition-colors hover:border-[#1D6F42] hover:text-[#1C1917]"
              >
                <span>{b.emoji}</span>
                {b.businessName}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#A8A29E]">Loads the archetype&apos;s inputs so you can tweak from there.</p>
        </section>

        {/* Numbers */}
        <section className="rounded-lg border border-[#E7E5E4] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1C1917]">Signals</h2>
          <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {NUMBER_FIELDS.map((fld) => {
              const err = errors[fld.key];
              return (
                <div key={fld.key}>
                  <label htmlFor={fld.key} className="block text-sm font-medium text-[#44403C]">
                    {fld.label} <span className="font-normal text-[#A8A29E]">· {fld.unit}</span>
                  </label>
                  <input
                    id={fld.key}
                    name={fld.key}
                    type="number"
                    inputMode="decimal"
                    step={fld.step}
                    value={form[fld.key]}
                    onChange={(e) => set(fld.key, e.target.value)}
                    aria-invalid={err ? true : undefined}
                    className={`${inputBase} ${err ? "border-[#B23A1E] focus:border-[#B23A1E] focus:ring-[#B23A1E]/15" : "border-[#E7E5E4]"}`}
                  />
                  {err && <p className="mt-1 text-xs text-[#B23A1E]">{err}</p>}
                </div>
              );
            })}
          </div>

          {/* Enums */}
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <label htmlFor="cashflowTrend" className="block text-sm font-medium text-[#44403C]">
                Cash-flow trend <span className="font-normal text-[#A8A29E]">· enum</span>
              </label>
              <select
                id="cashflowTrend"
                value={form.cashflowTrend}
                onChange={(e) => set("cashflowTrend", e.target.value)}
                className={`${inputBase} ${errors.cashflowTrend ? "border-[#B23A1E]" : "border-[#E7E5E4]"}`}
              >
                {CASHFLOW_OPTIONS.map((o) => (
                  <option key={o} value={o}>{cap(o)}</option>
                ))}
              </select>
              {errors.cashflowTrend && <p className="mt-1 text-xs text-[#B23A1E]">{errors.cashflowTrend}</p>}
            </div>
            <div>
              <label htmlFor="seasonality" className="block text-sm font-medium text-[#44403C]">
                Seasonality <span className="font-normal text-[#A8A29E]">· enum</span>
              </label>
              <select
                id="seasonality"
                value={form.seasonality}
                onChange={(e) => set("seasonality", e.target.value)}
                className={`${inputBase} ${errors.seasonality ? "border-[#B23A1E]" : "border-[#E7E5E4]"}`}
              >
                {SEASONALITY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{cap(o)}</option>
                ))}
              </select>
              {errors.seasonality && <p className="mt-1 text-xs text-[#B23A1E]">{errors.seasonality}</p>}
            </div>
          </div>
        </section>

        {/* Booleans */}
        <section className="rounded-lg border border-[#E7E5E4] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1C1917]">Risk flags</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {BOOL_FIELDS.map((fld) => (
              <label
                key={fld.key}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-[#E7E5E4] p-3 transition-colors hover:border-[#D6D3D1]"
              >
                <input
                  type="checkbox"
                  checked={form[fld.key]}
                  onChange={(e) => set(fld.key, e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#1D6F42]"
                />
                <span>
                  <span className="block text-sm font-medium text-[#1C1917]">{fld.label}</span>
                  <span className="block text-xs text-[#78716C]">{fld.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {formError && (
          <p className="rounded-md border border-[#E7C4B8] bg-[#FBEAE5] px-4 py-3 text-sm text-[#7A2615]">{formError}</p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-lg bg-[#1D6F42] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#14532D] disabled:cursor-default disabled:opacity-60"
          >
            {submitting ? "Assessing…" : "Assess with Aegis"}
          </button>
          {Object.keys(errors).length > 0 && (
            <span className="text-sm text-[#B23A1E]">Fix the highlighted fields to continue.</span>
          )}
        </div>
      </form>

      {result && (
        <section>
          <div className="mb-4 border-t border-[#E7E5E4] pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#1D6F42]">Live engine result</p>
          </div>
          <HealthCard a={result} />
        </section>
      )}
    </div>
  );
}
