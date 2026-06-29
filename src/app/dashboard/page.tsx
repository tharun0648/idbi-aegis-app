import Link from "next/link";
import { listBusinesses } from "@/engine/assessmentAdapter";

const verdictLabel: Record<string, string> = { reject: "Bureau: Reject", borderline: "Bureau: Borderline", approvable: "Bureau: Approvable" };

export default function Dashboard() {
  const businesses = listBusinesses();
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-[#78716C] hover:text-[#1C1917]">← Aegis</Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#1C1917]">Applications</h1>
      <p className="mt-1 text-sm text-[#78716C]">Three MSME applications awaiting underwriting review.</p>

      <ul className="mt-6 space-y-3">
        {businesses.map(b => (
          <li key={b.id}>
            <Link
              href={`/business/${b.id}`}
              className="flex items-center justify-between rounded-lg border border-[#E7E5E4] bg-white p-4 transition-colors hover:border-[#1D6F42]"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{b.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">{b.businessName}</p>
                  <p className="text-xs text-[#A8A29E]">{verdictLabel[b.bureauVerdict] ?? b.bureauVerdict}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-[#1D6F42]">Evaluate →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
