import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <p className="text-sm font-medium uppercase tracking-wide text-[#1D6F42]">Aegis · for IDBI</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[#1C1917] sm:text-5xl">
        The intelligence layer between data and the lending decision.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[#57534E]">
        Aegis reads alternative data the bureau can&apos;t see, builds an explainable lending assessment,
        and helps an underwriter decide — without replacing credit policy.
      </p>
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg bg-[#1D6F42] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#14532D]"
        >
          Evaluate demo businesses
        </Link>
      </div>
    </main>
  );
}
