"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";
import HealthCard from "@/components/health-card/HealthCard";
import type { EnrichedAssessment } from "@/engine/assessmentAdapter";

export default function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [a, setA] = useState<EnrichedAssessment | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    fetch(`/api/assessment/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => { if (alive) { setA(data); setStatus("ready"); } })
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm font-medium text-[#1F5E4A] transition-colors duration-150 hover:border-[#1F5E4A]"
          >
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} /> Run What-If Simulator
          </Link>
        )}
      </div>

      {status === "loading" && <p className="text-center text-sm text-[#9CA3AF]">Evaluating with Aegis…</p>}
      {status === "error" && <p className="text-center text-sm text-[#B42318]">Couldn&apos;t load this assessment.</p>}
      {status === "ready" && a && <HealthCard a={a} />}
    </main>
  );
}
