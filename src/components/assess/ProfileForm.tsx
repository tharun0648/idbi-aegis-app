"use client";

import { useState } from "react";
import { Building2, Info } from "lucide-react";
import { validateProfile, EXAMPLE_DEFAULT_PROFILE } from "@/engine/profileSchema";
import { SEEDS, type SeededBusiness } from "@/data/seeds";
import type { MSMEProfile } from "@/engine/aegis-core";
import type { EnrichedAssessment } from "@/engine/assessmentAdapter";
import type { AssessDebug } from "@/types/debug";
import HealthCard from "@/components/health-card/HealthCard";
import TransparencyPanel from "@/components/TransparencyPanel";

/**
 * The public input surface. Holds 13 form fields as the one place client
 * state is allowed for ad-hoc profiles, validates at the boundary
 * (validateProfile), and on success posts to /api/assess and renders the
 * SAME Health Card with the live engine result. No scoring lives here.
 *
 * Fields are grouped for comprehension (Business info / Financial signals /
 * Risk flags / Operational evidence) — presentation only. The 13-field shape,
 * validation, and submit flow are unchanged from the working single-page form.
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

// Plain-language, per-field help. Shown via an Info tooltip beside each label.
const FIELD_HELP: Record<string, string> = {
  cashflowTrend: "The recent trend in the business's cash flow, from declining to growing.",
  gstOnTimeRate: "How often the business files GST on time. 0 = never, 1 = always.",
  gstMaxGapCycles: "The longest streak of missed GST filing cycles in a row.",
  gstLastCycleLate: "Whether the most recent GST filing was late.",
  digitalReceiptsShare: "Share of revenue collected digitally (UPI, cards, etc.) rather than cash. 0 = none, 1 = all digital.",
  digitalHistoryMonths: "How many months of digital payment history are available to verify.",
  yearsOperating: "How long the business has been operating, in years.",
  avgReceivableDays: "Average number of days customers take to pay their invoices. Lower is healthier.",
  topVendorShare: "Revenue share from the single biggest customer, percent 0–100; higher means more concentration risk.",
  seasonality: "How much the business's revenue swings with the season, from low to severe.",
  seasonalCashDip: "Whether the business has a material cash shortfall during its low season.",
  activeDefault: "Whether the business currently has a live loan default or overdue payment. Hard policy flag — overrides the score.",
  kycMismatch: "Whether the business's identity documents show an inconsistency. Hard policy flag — overrides the score.",
};

const CASHFLOW_OPTIONS = ["declining", "volatile", "improving", "stable", "growing"] as const;
const SEASONALITY_OPTIONS = ["low", "moderate", "high", "severe"] as const;

// Alternative operational evidence — all optional; "" = Not available (0 contribution).
type AltKey = "electricityTrend" | "workforceTrend" | "utilityPayment" | "tredsHistory";
const ALT_FIELDS: ReadonlyArray<{ key: AltKey; label: string; hint: string; options: readonly string[] }> = [
  { key: "electricityTrend", label: "Electricity usage trend", hint: "Verified meter-load trend", options: ["declining", "stable", "growing"] },
  { key: "workforceTrend", label: "Workforce trend", hint: "Verified headcount / EPFO trend", options: ["declining", "stable", "growing"] },
  { key: "utilityPayment", label: "Utility bill payments (BBPS)", hint: "Verified BBPS payment regularity", options: ["irregular", "mostly_on_time", "always_on_time"] },
  { key: "tredsHistory", label: "TReDS invoice financing", hint: "Verified TReDS participation", options: ["none", "limited", "active"] },
];

const BOOL_FIELDS: ReadonlyArray<{ key: "gstLastCycleLate" | "seasonalCashDip" | "activeDefault" | "kycMismatch"; label: string; hint: string }> = [
  { key: "gstLastCycleLate", label: "GST last cycle late", hint: "Most recent filing was late" },
  { key: "seasonalCashDip", label: "Seasonal cash dip", hint: "Material seasonal cash gap" },
  { key: "activeDefault", label: "Active default", hint: "Live overdue / default — hard flag" },
  { key: "kycMismatch", label: "KYC mismatch", hint: "Identity inconsistency — hard flag" },
];

// Section groupings — presentation only, doesn't change the 13-field shape.
const BUSINESS_INFO_NUMBER_KEYS: NumberKey[] = ["yearsOperating"];
const FINANCIAL_NUMBER_KEYS: NumberKey[] = [
  "gstOnTimeRate", "gstMaxGapCycles", "digitalReceiptsShare", "digitalHistoryMonths", "avgReceivableDays", "topVendorShare",
];
const RISK_FLAG_BOOL_KEYS = ["seasonalCashDip", "activeDefault", "kycMismatch"] as const;

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
  electricityTrend: string;
  workforceTrend: string;
  utilityPayment: string;
  tredsHistory: string;
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
    electricityTrend: p.electricityTrend ?? "",
    workforceTrend: p.workforceTrend ?? "",
    utilityPayment: p.utilityPayment ?? "",
    tredsHistory: p.tredsHistory ?? "",
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
    // "" → undefined so the optional enums validate as "not available", never a bad value.
    electricityTrend: f.electricityTrend || undefined,
    workforceTrend: f.workforceTrend || undefined,
    utilityPayment: f.utilityPayment || undefined,
    tredsHistory: f.tredsHistory || undefined,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const altLabel = (s: string) => cap(s.replace(/_/g, " "));
const EXAMPLES: SeededBusiness[] = Object.values(SEEDS);

function FieldHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info tabIndex={0} aria-label={text} className="h-3.5 w-3.5 cursor-help text-[#9CA3AF] outline-none" strokeWidth={1.75} />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-56 -translate-x-1/2 rounded-md bg-[#111827] px-2.5 py-1.5 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function FieldLabel({ htmlFor, text, unit, fieldKey }: { htmlFor: string; text: string; unit?: string; fieldKey: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-[#111827]">
      {text} {unit && <span className="font-normal text-[#9CA3AF]">· {unit}</span>}
      {FIELD_HELP[fieldKey] && <FieldHint text={FIELD_HELP[fieldKey]} />}
    </label>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-[#6B7280]">{hint}</p>}
    </div>
  );
}

export default function ProfileForm() {
  const [form, setForm] = useState<FormState>(() => fromProfile(EXAMPLE_DEFAULT_PROFILE));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EnrichedAssessment | null>(null);
  const [debug, setDebug] = useState<AssessDebug | null>(null);
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
      setDebug(null);
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
        setDebug(null);
        return;
      }
      setResult(data.assessment as EnrichedAssessment);
      setDebug((data._debug as AssessDebug) ?? null);
    } catch {
      setFormError("Couldn't reach the assessment service.");
      setResult(null);
      setDebug(null);
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#1a4731] focus:ring-2 focus:ring-[#1a4731]/15";
  const errBorder = (key: string) => (errors[key] ? "border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/15" : "border-[#E5E7EB]");

  const businessInfoFields = NUMBER_FIELDS.filter((f) => BUSINESS_INFO_NUMBER_KEYS.includes(f.key));
  const financialFields = NUMBER_FIELDS.filter((f) => FINANCIAL_NUMBER_KEYS.includes(f.key));
  const riskFlagFields = BOOL_FIELDS.filter((f) => (RISK_FLAG_BOOL_KEYS as readonly string[]).includes(f.key));
  const gstLastCycleLateField = BOOL_FIELDS.find((f) => f.key === "gstLastCycleLate")!;

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Load example */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Start from a known case</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => loadExample(b.profile)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm text-[#374151] transition-colors duration-150 hover:border-[#1a4731] hover:text-[#111827]"
              >
                <Building2 className="h-4 w-4 text-[#6B7280]" strokeWidth={1.75} />
                {b.businessName}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#9CA3AF]">Loads the archetype&apos;s inputs so you can tweak from there.</p>
        </section>

        {/* Business info */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <SectionHeader title="Business info" hint="What kind of business this is and how it has been trending." />
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="cashflowTrend" text="Cash-flow trend" unit="enum" fieldKey="cashflowTrend" />
              <select
                id="cashflowTrend"
                value={form.cashflowTrend}
                onChange={(e) => set("cashflowTrend", e.target.value)}
                className={`${inputBase} ${errBorder("cashflowTrend")}`}
              >
                {CASHFLOW_OPTIONS.map((o) => (
                  <option key={o} value={o}>{cap(o)}</option>
                ))}
              </select>
              {errors.cashflowTrend && <p className="mt-1 text-xs text-[#dc2626]">{errors.cashflowTrend}</p>}
            </div>
            <div>
              <FieldLabel htmlFor="seasonality" text="Seasonality" unit="enum" fieldKey="seasonality" />
              <select
                id="seasonality"
                value={form.seasonality}
                onChange={(e) => set("seasonality", e.target.value)}
                className={`${inputBase} ${errBorder("seasonality")}`}
              >
                {SEASONALITY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{cap(o)}</option>
                ))}
              </select>
              {errors.seasonality && <p className="mt-1 text-xs text-[#dc2626]">{errors.seasonality}</p>}
            </div>
            {businessInfoFields.map((fld) => (
              <div key={fld.key}>
                <FieldLabel htmlFor={fld.key} text={fld.label} unit={fld.unit} fieldKey={fld.key} />
                <input
                  id={fld.key}
                  name={fld.key}
                  type="number"
                  inputMode="decimal"
                  step={fld.step}
                  value={form[fld.key]}
                  onChange={(e) => set(fld.key, e.target.value)}
                  aria-invalid={errors[fld.key] ? true : undefined}
                  className={`${inputBase} ${errBorder(fld.key)}`}
                />
                {errors[fld.key] && <p className="mt-1 text-xs text-[#dc2626]">{errors[fld.key]}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Financial signals */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <SectionHeader title="Financial signals" hint="GST compliance, digital adoption, and payment behaviour." />
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {financialFields.map((fld) => (
              <div key={fld.key}>
                <FieldLabel htmlFor={fld.key} text={fld.label} unit={fld.unit} fieldKey={fld.key} />
                <input
                  id={fld.key}
                  name={fld.key}
                  type="number"
                  inputMode="decimal"
                  step={fld.step}
                  value={form[fld.key]}
                  onChange={(e) => set(fld.key, e.target.value)}
                  aria-invalid={errors[fld.key] ? true : undefined}
                  className={`${inputBase} ${errBorder(fld.key)}`}
                />
                {errors[fld.key] && <p className="mt-1 text-xs text-[#dc2626]">{errors[fld.key]}</p>}
              </div>
            ))}
          </div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md border border-[#E5E7EB] p-3 transition-colors duration-150 hover:border-[#D1D5DB]">
            <input
              type="checkbox"
              checked={form.gstLastCycleLate}
              onChange={(e) => set("gstLastCycleLate", e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1a4731]"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-[#111827]">
                {gstLastCycleLateField.label}
                <FieldHint text={FIELD_HELP.gstLastCycleLate} />
              </span>
              <span className="block text-xs text-[#6B7280]">{gstLastCycleLateField.hint}</span>
            </span>
          </label>
        </section>

        {/* Risk flags */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <SectionHeader title="Risk flags" hint="Active or default and KYC mismatch are hard flags — they override the score outright." />
          <div className="grid gap-3 sm:grid-cols-2">
            {riskFlagFields.map((fld) => (
              <label
                key={fld.key}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-[#E5E7EB] p-3 transition-colors duration-150 hover:border-[#D1D5DB]"
              >
                <input
                  type="checkbox"
                  checked={form[fld.key]}
                  onChange={(e) => set(fld.key, e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#1a4731]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-[#111827]">
                    {fld.label}
                    <FieldHint text={FIELD_HELP[fld.key]} />
                  </span>
                  <span className="block text-xs text-[#6B7280]">{fld.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Operational evidence (optional) */}
        <section className="rounded-xl border border-[#1a473140] bg-[#f0fdf4] p-6 shadow-sm">
          <SectionHeader title="Operational evidence" hint="Optional. Independently verifiable signals — each can only raise a borderline score, capped at +10. Leave as “Not available” if unverified." />
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {ALT_FIELDS.map((fld) => {
              const err = errors[fld.key];
              return (
                <div key={fld.key}>
                  <label htmlFor={fld.key} className="block text-sm font-medium text-[#111827]">
                    {fld.label} <span className="font-normal text-[#9CA3AF]">· optional</span>
                  </label>
                  <select
                    id={fld.key}
                    value={form[fld.key]}
                    onChange={(e) => set(fld.key, e.target.value)}
                    className={`${inputBase} ${errBorder(fld.key)}`}
                  >
                    <option value="">Not available</option>
                    {fld.options.map((o) => (
                      <option key={o} value={o}>{altLabel(o)}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[#9CA3AF]">{fld.hint}</p>
                  {err && <p className="mt-1 text-xs text-[#dc2626]">{err}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {formError && (
          <p className="rounded-md border border-[#dc262640] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{formError}</p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-lg bg-[#1a4731] px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#166534] disabled:cursor-default disabled:opacity-60"
          >
            {submitting ? "Assessing…" : "Assess with Aegis"}
          </button>
          {Object.keys(errors).length > 0 && (
            <span className="text-sm text-[#dc2626]">Fix the highlighted fields to continue.</span>
          )}
        </div>
      </form>

      {result && (
        <section className="space-y-4">
          <div className="mb-4 border-t border-[#E5E7EB] pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#1a4731]">Live engine result</p>
          </div>
          <HealthCard a={result} />
          {debug && <TransparencyPanel debug={debug} />}
        </section>
      )}
    </div>
  );
}
