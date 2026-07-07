import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="px-6 py-12">
      <div className="mx-auto w-full max-w-[1180px]">
        <Link href={`/business/${seed.id}`} className="text-sm text-[#78716C] hover:text-[#1C1917]">
          ← Back to assessment
        </Link>
        <header className="mb-6 mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">What-if simulator</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1C1917]">{seed.businessName}</h1>
          <p className="mt-1 text-sm text-[#78716C]">
            Move the levers to see how behaviour would change the decision. Aegis recomputes the full assessment on every step.
          </p>
        </header>
        <WhatIfPanel profile={seed.profile} business={business} />
      </div>
    </main>
  );
}
