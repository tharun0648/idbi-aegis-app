import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { SEEDS } from "@/data/seeds";
import type { BusinessMeta } from "@/engine/assessmentAdapter";
import WhatIfPanel from "@/components/simulator/WhatIfPanel";

export default async function SimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seed = SEEDS[id as keyof typeof SEEDS];
  if (!seed) notFound();

  const business: BusinessMeta = {
    id: seed.id,
    businessName: seed.businessName,
    archetype: seed.archetype,
    emoji: "", // not surfaced — lucide verdict icons replace emoji
    bureauScore: seed.bureauScore,
    bureauVerdict: seed.bureauVerdict,
  };

  return (
    <main className="px-8 py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#111827]">Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" strokeWidth={2} />
          <Link href={`/business/${seed.id}`} className="hover:text-[#111827]">{seed.businessName}</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" strokeWidth={2} />
          <span className="font-medium text-[#111827]">What-If Simulator</span>
        </nav>
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">What-if simulator</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827]">{seed.businessName}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Adjust operational levers; the engine re-scores live. Aegis recomputes the full assessment on every step.
          </p>
        </header>
        <WhatIfPanel profile={seed.profile} business={business} />
      </div>
    </main>
  );
}
