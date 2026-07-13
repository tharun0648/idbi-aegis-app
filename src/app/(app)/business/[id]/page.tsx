"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";
import HealthCard from "@/components/health-card/HealthCard";
import TransparencyPanel from "@/components/TransparencyPanel";
import { SEEDS, type SeededBusiness } from "@/data/seeds";
import type { EnrichedAssessment } from "@/engine/assessmentAdapter";
import type { AssessDebug } from "@/types/debug";

export default function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [a, setA] = useState<EnrichedAssessment | null>(null);
  const [debug, setDebug] = useState<AssessDebug | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    const seed = SEEDS[id as SeededBusiness["id"]];
    if (!seed) {
      setStatus("error");
      return;
    }
    fetch("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: seed.profile,
        business: {
          id: seed.id,
          businessName: seed.businessName,
          archetype: seed.archetype,
          bureauScore: seed.bureauScore,
          bureauVerdict: seed.bureauVerdict,
        },
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!alive) return;
        if (!data.ok) { setStatus("error"); return; }
        setA(data.assessment as EnrichedAssessment);
        setDebug((data._debug as AssessDebug) ?? null);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => { alive = false; };
  }, [id]);

  return (
    <main className="px-8 py-8">
      <div className="mx-auto mb-6 flex w-full max-w-[1180px] items-center justify-between gap-4">
        <nav className="flex items-center gap-1.5 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#111827]">Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" strokeWidth={2} />
          <span className="font-medium text-[#111827]">Assessment</span>
        </nav>
        {status === "ready" && a && (
          <Link
            href={`/simulator/${id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm font-medium text-[#1a4731] transition-colors duration-150 hover:border-[#1a4731]"
          >
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} /> Run What-If Simulator
          </Link>
        )}
      </div>

      {status === "loading" && <p className="text-center text-sm text-[#9CA3AF]">Evaluating with Aegis…</p>}
      {status === "error" && <p className="text-center text-sm text-[#dc2626]">Couldn&apos;t load this assessment.</p>}
      {status === "ready" && a && (
        <>
          <HealthCard a={a} />
          {debug && (
            <div className="mx-auto mt-6 w-full max-w-[1180px]">
              <TransparencyPanel debug={debug} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
