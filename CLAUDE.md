# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Aegis is an explainable credit-decision layer for MSME lending (IDBI Innovate 2026, PS3: Financial Health Score). It reads alternative-data signals about a business and produces a Financial Health Card with an underwriting recommendation backed by evidence — it advises an underwriter, it does not auto-approve. See `README.md` for the problem framing and demo narrative.

Stack: Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS, Vitest.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm test         # run the Vitest suite once
npm run lint     # next lint

# single test file / single case
npx vitest run src/engine/aegis-core.test.ts
npx vitest run -t "Invisible Champion"
```

Requires Node 18.18+ (Node 20+ recommended).

## Architecture: the engine is sacred

The single most important rule. Credit logic is **deterministic and isolated** in `src/engine/aegis-core.ts`. There is **no LLM, no HTTP, no IO, no IDs, no persistence** in that file. It takes an `MSMEProfile` and returns a `CoreAssessment`. Read the header comment in that file before touching it.

The data flow is a one-way pipeline, and each stage lives in a different layer:

```
MSMEProfile (src/data/seeds.ts)
  → assess()                src/engine/aegis-core.ts   factors → scoring → policy → decision (pure)
                                                        └ computeAltEvidence()  src/engine/altEvidence.ts (pure plug-in)
  → getAssessment()         src/engine/assessmentAdapter.ts   adds business meta + narrative → EnrichedAssessment
  → GET /api/assessment/:id  src/app/api/assessment/[id]/route.ts
  → fetch in page           src/app/business/[id]/page.tsx
  → recommendationView()    src/view-models/healthCard.ts   maps engine enum → UI title/tone/colour
  → <HealthCard>            src/components/health-card/*
```

There are **two entry points into the same engine**, and they converge on the same `EnrichedAssessment` contract and the same `<HealthCard>`:

1. **Seed path** (above): `getAssessment(id)` looks a seeded business up by id — no validation needed, seeds are trusted.
2. **Public-input path**: `/assess` page → `<ProfileForm>` (`src/components/assess/ProfileForm.tsx`) → `POST /api/assess` (`src/app/api/assess/route.ts`) → `validateProfile()` (`src/engine/profileSchema.ts`) → `assessAdHoc(profile)`. Untrusted input is Zod-validated at the boundary *before* it reaches the engine; on failure the route returns `400` with per-field errors and `assess()` is never called.

Key invariants to preserve when editing:

- **The UI renders ONLY from `EnrichedAssessment`** (the API contract in `assessmentAdapter.ts`). Don't have components recompute scores.
- **The view-model is a freeze boundary.** Components render the decision through `recommendationView()` / `selectDrivers()` in `src/view-models/healthCard.ts`, never off the raw `Recommendation` enum. If a recommendation's wording, tone, or colour changes, edit only the `REC_VIEW` / `TONES` tables there — no component should need to change. All decision colours live in `TONES`.
- **Two-tier risk is deliberate.** Positive `Factor`s build a `capabilityScore`; soft `Penalty`s deduct points; **hard `HardFlag`s are knockouts** that force `REFER_OR_DECLINE` regardless of score. A strong score must never buy past a hard flag. Avoid double-counting: when a hard flag captures a problem (e.g. GST gap), suppress the matching soft penalty (see `softPenalties` GST handling) — there's a test guarding this.
- **The alternative-evidence layer is an additive, bounded plug-in.** `src/engine/altEvidence.ts` reads four *optional* operational signals (electricity, workforce, utility payments, TReDS) and returns a positive-only contribution: **per-signal floor 0** (a bad signal never subtracts), **total cap +10**, absent signal → 0. It is imported by the core but **never touches factor/penalty/hard-flag math**. So there are two scores: `netScore` (frozen 100-point core) and `adjustedNetScore` (= `netScore` + evidence, capped at the ceiling). **The recommendation now bands on `adjustedNetScore`**, and `decisionConfidence` factors evidence coverage. Critically: when a hard flag is present the engine returns the core *untouched* — `alternativeEvidenceScore` is 0 and `adjustedNetScore == netScore`. Evidence can lift a borderline score; it can never rescue a knockout. The `<EvidenceSection>` renders only when `alternativeEvidenceScore > 0` and there are no hard flags (both guaranteed by the engine).
- **Validation lives at the boundary, not in the engine.** The engine is import-free and trusts its input; `src/engine/profileSchema.ts` (Zod) is the *only* place untrusted input is checked, with no coercion (garbage is rejected, never rounded into a false APPROVE). Note the deliberate unit split: `gstOnTimeRate`/`digitalReceiptsShare` are ratios `0..1` but `topVendorShare` is a percent `0..100`. `assess()` also has a belt-and-suspenders guard (`assertAssessable`) that throws loudly on non-finite numbers or unknown enums — it enforces invariants only, it never clamps or coerces.
- **The LLM (planned) only phrases already-decided output.** `businessNarrative` is the one LLM-authored field and is currently `null`. The `DecisionTrace` (drivers, risks, reason) is deterministic engine output that a narrator will rephrase — it must never compute a number or change a decision. When phrasing, the score to reference is `adjustedNetScore` (not `netScore`) whenever there's no hard flag.

## The simulator

`src/app/simulator/[id]/page.tsx` + `src/components/simulator/WhatIfPanel.tsx`. The What-If panel is the **one place client state is allowed**. It holds slider values, calls the engine's `simulate()` (= `assess(applyLevers(...))`) on every change, and re-renders the *same* `HealthCard` with the fresh result. No scoring lives in the component — `Lever`s mutate raw `MSMEProfile` inputs and the engine re-runs. Slider bounds are derived from `CLIMBER_LEVERS` in `seeds.ts`, not hardcoded.

## Tests guard the demo narrative

`src/engine/aegis-core.test.ts` asserts the three seeded archetypes behave as the demo story requires (Champion approves despite no bureau file; Mirage is knocked out by a GST hard flag; Climber starts below the line and crosses it on the first lever). If you change a weight, threshold (`APPROVE_LINE` 60 / `CONDITIONAL_LINE` 50), or derivation and a test breaks, you've changed the story — decide deliberately whether to fix the engine or update the test, don't paper over it.

`src/engine/profileSchema.test.ts` guards the boundary: valid input parses, invalid/NaN/out-of-range input is rejected with per-field errors, and the ratio-vs-percent unit split holds.

## Conventions

- Import via the `@/*` alias → `src/*` (configured in `tsconfig.json` and mirrored in `vitest.config.ts`).
- App Router route params are async: `params: Promise<{ id: string }>` — `await params` (server) or `use(params)` (client).
- Seed data lives in the data layer (`src/data/seeds.ts`), never in the engine, so the source can later be swapped for a ULI / Account Aggregator adapter without touching decision logic.

> Note: the "Project structure" section of `README.md` predates the `src/` migration and lists stale root-level paths (`aegis-core.ts`, `lib/...`). Trust the `src/` tree, not the README's paths.
