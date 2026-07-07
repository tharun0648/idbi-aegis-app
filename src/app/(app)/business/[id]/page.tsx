"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
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
    <main className="px-6 py-12">
      <div className="mx-auto mb-6 flex w-full max-w-[1180px] items-center justify-between gap-4">
        <Link href="/dashboard" className="text-sm text-[#78716C] hover:text-[#1C1917]">← Applications</Link>
        {status === "ready" && a && (
          <Link href={`/simulator/${id}`} className="text-sm font-medium text-[#1D6F42] hover:underline">
            Run what-if simulator →
          </Link>
        )}
      </div>
      {status === "loading" && <p className="text-center text-sm text-[#A8A29E]">Evaluating with Aegis…</p>}
      {status === "error" && <p className="text-center text-sm text-[#B23A1E]">Couldn&apos;t load this assessment.</p>}
      {status === "ready" && a && <HealthCard a={a} />}
    </main>
  );
}
