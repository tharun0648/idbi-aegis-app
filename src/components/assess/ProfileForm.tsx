"use client";

import { useState } from "react";
import { Building2, Info, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { validateProfile, EXAMPLE_DEFAULT_PROFILE } from "@/engine/profileSchema";
import { SEEDS, type SeededBusiness } from "@/data/seeds";
import type { MSMEProfile } from "@/engine/aegis-core";
import type { EnrichedAssessment } from "@/engine/assessmentAdapter";
import type { AssessDebug } from "@/types/debug";
import HealthCard from "@/components/health-card/HealthCard";
import TransparencyPanel from "@/components/TransparencyPanel";
import { PROFILE_FIELD_ORDER } from "@/constants/profileFields";

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

// Decorative-only business-identity chrome. These fields do NOT exist in
// MSMEProfile, are never read by toRaw()/validateProfile(), and never appear
// in PROFILE_FIELD_ORDER or the Transparency Panel. Their own local state,
// entirely separate from FormState — display narrative only, zero effect on
// the assessment.
type BusinessIdentity = {
  businessName: string;
  annualTurnover: string;
  industry: string;
  gstin: string;
  city: string;
};

const BUSINESS_IDENTITY_FIELDS: ReadonlyArray<{
  key: keyof BusinessIdentity;
  label: string;
  hint: string;
}> = [
  { key: "businessName", label: "Business name", hint: "From MCA / UDYAM registration" },
  { key: "annualTurnover", label: "Annual turnover (₹)", hint: "Typically from Account Aggregator or GST returns" },
  { key: "industry", label: "Industry", hint: "From business registration" },
  { key: "gstin", label: "GSTIN", hint: "From GSTN" },
  { key: "city", label: "City", hint: "From business registration" },
];

const EMPTY_BUSINESS_IDENTITY: BusinessIdentity = {
  businessName: "", annualTurnover: "", industry: "", gstin: "", city: "",
};

const STEPS = ["Business", "Financial", "Risk Flags", "Operational Evidence", "Review"] as const;

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  state === "done" ? "bg-[#15803d] text-white"
                  : state === "active" ? "bg-[#1a4731] text-white"
                  : "border border-[#D1D5DB] text-[#9CA3AF]"
                }`}
              >
                {state === "done" ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:inline ${state === "upcoming" ? "text-[#9CA3AF]" : "font-semibold text-[#111827]"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-3 h-0.5 flex-1 ${i < current ? "bg-[#15803d]" : "bg-[#E5E7EB]"}`} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function ProfileForm() {
  const [form, setForm] = useState<FormState>(() => fromProfile(EXAMPLE_DEFAULT_PROFILE));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EnrichedAssessment | null>(null);
  const [debug, setDebug] = useState<AssessDebug | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  // Decorative-only — never read by toRaw()/validateProfile(), never submitted.
  const [identity, setIdentity] = useState<BusinessIdentity>(EMPTY_BUSINESS_IDENTITY);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setIdentity_ = <K extends keyof BusinessIdentity>(key: K, value: string) =>
    setIdentity((prev) => ({ ...prev, [key]: value }));

  const loadExample = (p: MSMEProfile) => {
    setForm(fromProfile(p));
    setErrors({});
    setFormError(null);
    setResult(null);
    setStep(0);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Validate at the boundary. If invalid, show inline errors — engine is NOT called.
    const validation = validateProfile(toRaw(form));
    if (!validation.ok) {
      setErrors(validation.errors);
      const errorKeys = Object.keys(validation.errors);
      const stepOfField = (k: string): number => {
        const idx = FIELDS_BY_STEP.findIndex((fields) => fields.includes(k));
        return idx === -1 ? STEPS.length - 1 : idx; // unmatched key → Review (last step)
      };
      if (errorKeys.length > 0) setStep(Math.min(...errorKeys.map(stepOfField)));
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

  const FIELDS_BY_STEP: readonly string[][] = [
    ["cashflowTrend", "seasonality", "yearsOperating"],
    ["gstLastCycleLate", ...FINANCIAL_NUMBER_KEYS],
    [...RISK_FLAG_BOOL_KEYS],
    ["electricityTrend", "workforceTrend", "utilityPayment", "tredsHistory"],
  ];

  // Validate with the SAME validateProfile() used at final submit, but only
  // surface and gate on errors belonging to the step the user is currently
  // on — fields on unvisited later steps still hold their (valid) defaults,
  // so this never blocks on a field the user hasn't reached yet.
  function goNext() {
    const validation = validateProfile(toRaw(form));
    const stepFields = FIELDS_BY_STEP[step] ?? [];
    const stepErrors: Record<string, string> = {};
    if (!validation.ok) {
      for (const key of stepFields) {
        if (validation.errors[key]) stepErrors[key] = validation.errors[key];
      }
    }
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of stepFields) delete next[key];
      return { ...next, ...stepErrors };
    });
    if (Object.keys(stepErrors).length === 0) {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }
  }

  return (
    <div className="space-y-6">
      <Stepper current={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Load example — shown only on step 0, same as before */}
          {step === 0 && (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Start from a known case</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => { loadExample(b.profile); setStep(0); }}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm text-[#374151] transition-colors duration-150 hover:border-[#1a4731] hover:text-[#111827]"
                  >
                    <Building2 className="h-4 w-4 text-[#6B7280]" strokeWidth={1.75} />
                    {b.businessName}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#9CA3AF]">Loads the archetype&apos;s inputs so you can tweak from there.</p>
            </section>
          )}

          {/* Step 1: Business */}
          {step === 0 && (
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

              {/* Decorative-only — display chrome, never submitted or validated */}
              <div className="mt-6 border-t border-[#E5E7EB] pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
                  Business identity <span className="normal-case font-normal">(display only — not scored)</span>
                </p>
                <div className="mt-3 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  {BUSINESS_IDENTITY_FIELDS.map((fld) => (
                    <div key={fld.key}>
                      <label htmlFor={`identity-${fld.key}`} className="block text-sm font-medium text-[#111827]">{fld.label}</label>
                      <input
                        id={`identity-${fld.key}`}
                        type="text"
                        value={identity[fld.key]}
                        onChange={(e) => setIdentity_(fld.key, e.target.value)}
                        className={inputBase}
                      />
                      <p className="mt-1 text-xs text-[#9CA3AF]">{fld.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Financial */}
          {step === 1 && (
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
              <label className="mt-5 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-md border border-[#E5E7EB] p-3 transition-colors duration-150 hover:border-[#D1D5DB]">
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
          )}

          {/* Step 3: Risk Flags */}
          {step === 2 && (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <SectionHeader title="Risk flags" hint="Active default and KYC mismatch are hard flags — they override the score outright." />
              <div className="grid gap-3 sm:grid-cols-2">
                {riskFlagFields.map((fld) => (
                  <label
                    key={fld.key}
                    className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-md border border-[#E5E7EB] p-3 transition-colors duration-150 hover:border-[#D1D5DB]"
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
          )}

          {/* Step 4: Operational Evidence */}
          {step === 3 && (
            <section className="rounded-xl border border-[#1a473140] bg-[#f0fdf4] p-6 shadow-sm">
              <SectionHeader title="Operational evidence" hint="Optional. Each verified signal provides bounded uplift (max +10 total). Does not override hard flags." />
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
          )}

          {/* Step 5: Review */}
          {step === 4 && (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <SectionHeader title="Review" hint="Zod validates on submit — fix any highlighted fields if they appear." />

              <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
                Business identity <span className="normal-case font-normal">(display only — not submitted)</span>
              </p>
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  {BUSINESS_IDENTITY_FIELDS.map((fld, i) => (
                    <tr key={fld.key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                      <td className="px-3 py-1.5 text-[#6B7280]">{fld.label}</td>
                      <td className="px-3 py-1.5 text-[#111827]">{identity[fld.key] || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Signals submitted to the engine</p>
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  {PROFILE_FIELD_ORDER.map((key, i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                      <td className="px-3 py-1.5 text-[#6B7280]">{key}</td>
                      <td className="px-3 py-1.5 text-[#111827]">{String(form[key] === "" ? "Not available" : form[key])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {formError && (
            <p className="rounded-md border border-[#dc262640] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{formError}</p>
          )}

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[#6B7280] ${step === 0 ? "invisible" : ""}`}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#1a4731] px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#166534]"
              >
                Next: {STEPS[step + 1]} <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-[#1a4731] px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#166534] disabled:cursor-default disabled:opacity-60"
              >
                {submitting ? "Assessing…" : "Assess with Aegis"}
              </button>
            )}
          </div>
          {Object.keys(errors).length > 0 && (
            <p className="text-sm text-[#dc2626]">Fix the highlighted fields to continue.</p>
          )}
          <p className="text-center text-xs text-[#9CA3AF]">All inputs are validated at the boundary. Nothing is scored until you submit.</p>
        </form>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-sm font-medium text-[#111827]">About this assessment</p>
            <ul className="mt-3 space-y-2">
              {["13 signals", "Deterministic scoring", "No AI in scoring", "Advises the underwriter"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                  <Check className="h-4 w-4 shrink-0 text-[#15803d]" strokeWidth={2} />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

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
