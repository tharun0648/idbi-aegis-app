import Link from "next/link";
import ProfileForm from "@/components/assess/ProfileForm";

export default function AssessPage() {
  return (
    <main className="px-6 py-12">
      <div className="mx-auto w-full max-w-[1180px]">
        <Link href="/dashboard" className="text-sm text-[#78716C] hover:text-[#1C1917]">← Applications</Link>
        <header className="mb-8 mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Try Aegis</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1C1917]">Assess any profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#57534E]">
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
