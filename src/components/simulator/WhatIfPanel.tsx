"use client";

import { useMemo, useState } from "react";
import { assess, simulate, type Lever, type MSMEProfile } from "@/engine/aegis-core";
import { CLIMBER_LEVERS } from "@/data/seeds";
import type { BusinessMeta, EnrichedAssessment } from "@/engine/assessmentAdapter";
import { recommendationView } from "@/view-models/healthCard";
import HealthCard from "@/components/health-card/HealthCard";
import ScenarioSlider from "./ScenarioSlider";

/**
 * The What-If simulator — the one client component where state is allowed.
 * It holds the three slider values, hands them to the engine's simulate() on
 * every change, and re-renders the SAME Health Card with the fresh result.
 * No scoring lives here: every number on screen comes back from the engine.
 *
 * Slider bounds run from the borrower's current value to the Climber lever
 * target (from CLIMBER_LEVERS) — so the ranges are engine-defined, not guessed.
 */

type ByType<T extends Lever["type"]> = Extract<Lever, { type: T }>;
const TARGET_DAYS = (CLIMBER_LEVERS.find(l => l.type === "reduceReceivables") as ByType<"reduceReceivables">).toDays;
const TARGET_GST = (CLIMBER_LEVERS.find(l => l.type === "regularizeGst") as ByType<"regularizeGst">).toOnTimeRate;
const TARGET_VENDOR = (CLIMBER_LEVERS.find(l => l.type === "diversifyVendor") as ByType<"diversifyVendor">).toShare;

const bounds = (a: number, b: number): [number, number] => [Math.min(a, b), Math.max(a, b)];

export default function WhatIfPanel({ profile, business }: { profile: MSMEProfile; business: BusinessMeta }) {
  const [days, setDays] = useState(profile.avgReceivableDays);
  const [gst, setGst] = useState(profile.gstOnTimeRate);
  const [vendor, setVendor] = useState(profile.topVendorShare);

  // Baseline (sliders untouched) — the reference for deltas and cleared penalties.
  const base = useMemo(() => assess(profile), [profile]);

  // Only pass a lever when its slider has actually moved. Critical for
  // regularizeGst, which also clears gstLastCycleLate as a side effect.
  const levers = useMemo<Lever[]>(() => {
    const ls: Lever[] = [];
    if (days !== profile.avgReceivableDays) ls.push({ type: "reduceReceivables", toDays: days });
    if (gst !== profile.gstOnTimeRate) ls.push({ type: "regularizeGst", toOnTimeRate: gst });
    if (vendor !== profile.topVendorShare) ls.push({ type: "diversifyVendor", toShare: vendor });
    return ls;
  }, [profile, days, gst, vendor]);

  const core = useMemo(() => simulate(profile, levers), [profile, levers]);
  const enriched: EnrichedAssessment = { ...core, business, businessNarrative: null };

  // Pure presentation diffs — no math, just comparing two engine outputs.
  const cleared = base.penalties.filter(p => !core.penalties.some(q => q.name === p.name));
  const netDelta = core.netScore - base.netScore;
  const bandChanged = core.recommendation !== base.recommendation;
  const baseView = recommendationView(base.recommendation);
  const nowView = recommendationView(core.recommendation);
  const knockout = core.hardFlags.length > 0;
  const dirty = levers.length > 0;

  const [daysMin, daysMax] = bounds(profile.avgReceivableDays, TARGET_DAYS);
  const [gstMin, gstMax] = bounds(profile.gstOnTimeRate, TARGET_GST);
  const [vendorMin, vendorMax] = bounds(profile.topVendorShare, TARGET_VENDOR);

  const reset = () => {
    setDays(profile.avgReceivableDays);
    setGst(profile.gstOnTimeRate);
    setVendor(profile.topVendorShare);
  };

  const deltaColor = netDelta > 0 ? "#1D6F42" : netDelta < 0 ? "#B23A1E" : "#78716C";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* controls */}
      <aside className="space-y-6 lg:sticky lg:top-6">
        <section className="rounded-lg border border-[#E7E5E4] bg-white p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-[#1C1917]">Adjust the levers</h2>
            <button
              type="button"
              onClick={reset}
              disabled={!dirty}
              className="text-xs font-medium text-[#57534E] underline-offset-2 hover:underline disabled:cursor-default disabled:text-[#D6D3D1] disabled:no-underline"
            >
              Reset
            </button>
          </div>
          <p className="mt-0.5 text-xs text-[#78716C]">Model a behaviour change; Aegis re-scores live.</p>
          <div className="mt-5 space-y-6">
            <ScenarioSlider label="Receivable days" value={days} min={daysMin} max={daysMax} step={1}
              format={v => `${v} days`} hint="Lower is better" onChange={setDays} />
            <ScenarioSlider label="GST compliance" value={gst} min={gstMin} max={gstMax} step={0.01}
              format={v => `${Math.round(v * 100)}%`} hint="Higher is better" onChange={setGst} />
            <ScenarioSlider label="Vendor concentration" value={vendor} min={vendorMin} max={vendorMax} step={1}
              format={v => `${v}%`} hint="Lower is better" onChange={setVendor} />
          </div>
        </section>

        {/* what changed */}
        <section className="rounded-lg border border-[#E7E5E4] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1C1917]">What changes</h2>

          <div className="mt-4 flex items-baseline justify-between gap-4">
            <span className="text-sm text-[#57534E]">Net score</span>
            <span className="flex items-baseline gap-2 tabular-nums">
              <span className="text-[#A8A29E]">{base.netScore}</span>
              <span className="text-[#D6D3D1]">→</span>
              <span className="text-lg font-semibold" style={{ color: nowView.colors.accent }}>{core.netScore}</span>
              {netDelta !== 0 && (
                <span className="text-xs font-semibold" style={{ color: deltaColor }}>
                  {netDelta > 0 ? `+${netDelta}` : netDelta}
                </span>
              )}
            </span>
          </div>

          <div
            className="mt-3 rounded-md border p-3"
            style={{
              borderColor: bandChanged ? nowView.colors.border : "#E7E5E4",
              background: bandChanged ? nowView.colors.tint : "transparent",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Recommendation</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-2 text-sm">
              <span className={bandChanged ? "text-[#A8A29E] line-through" : "font-semibold text-[#1C1917]"}>
                {baseView.title}
              </span>
              {bandChanged && (
                <>
                  <span className="text-[#D6D3D1]">→</span>
                  <span className="font-semibold" style={{ color: nowView.colors.ink }}>{nowView.title}</span>
                </>
              )}
            </p>
          </div>

          {cleared.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#A8A29E]">Penalties cleared</p>
              <ul className="mt-2 space-y-1.5">
                {cleared.map(p => (
                  <li key={p.name} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-[#57534E] line-through decoration-[#B23A1E]/40">{p.name}</span>
                    <span className="font-medium tabular-nums text-[#1D6F42]">+{Math.abs(p.points)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {knockout && (
            <div className="mt-4 rounded-md border-2 border-[#E7C4B8] bg-[#FBEAE5] p-3">
              <p className="text-xs font-semibold text-[#7A2615]">Policy violation is a knockout</p>
              <p className="mt-1 text-xs text-[#7A2615]/90">
                Behaviour can&apos;t fix a policy breach. The recommendation stays Refer / Decline at any score until the
                flag is resolved — there is no slider path to yes.
              </p>
            </div>
          )}
        </section>
      </aside>

      {/* the SAME Health Card, re-scored live */}
      <div className="min-w-0">
        <HealthCard a={enriched} />
      </div>
    </div>
  );
}
