import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProfileForm from "@/components/assess/ProfileForm";

export default function AssessPage() {
  return (
    <main className="px-8 py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#111827]">Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" strokeWidth={2} />
          <span className="font-medium text-[#111827]">Assess a profile</span>
        </nav>
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Try Aegis</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827]">Assess any profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
            Enter the 13 alternative-data signals and Aegis runs the real engine — the same one behind every
            demo case — and renders the full Health Card. Inputs are validated at the boundary; nothing is
            scored until they pass. Load an example to start from a known case and tweak.
          </p>
        </header>
        <ProfileForm />
      </div>
    </main>
  );
}
