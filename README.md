# Aegis

An explainable credit-decision layer for MSME lending, built for IDBI Innovate 2026 (Problem Statement 3: Financial Health Score).

## Problem

Banks evaluate MSME credit using traditional financial documents that many New-to-Credit (NTC) and New-to-Bank (NTB) businesses lack. Rich alternative data exists (GST, UPI, Account Aggregator, EPFO), but without a unified way to read it, viable borrowers get rejected and good applicants are hard to separate from risky ones. The result is high rejection rates and slow financial inclusion.

## Approach

Aegis does not try to be another credit score. Scores are already a solved, commoditised problem, and rails like RBI's Unified Lending Interface (ULI) already aggregate the underlying data. Aegis sits one layer above that: it reads alternative-data signals, produces an explainable Financial Health Card, and recommends an underwriting decision with evidence.

Three ideas shape the design:

1. **Augmentation, not replacement.** Aegis advises an underwriter. It does not overrule credit policy or auto-approve. Every output is meant to be defended to a risk team or a regulator.
2. **The score is an output, not the product.** The engine answers "would the bank lend to this business today, and if not, what would need to change?" The number falls out of that, it does not lead it.
3. **Two-tier risk.** Positive factors build a capability score. Soft penalties are point deductions that a business can improve. Hard policy flags (for example, a GST filing gap) are knockouts that cap the recommendation regardless of score, so a strong score can never buy past a compliance violation.

## How it works

```
MSME profile
   -> Factor engine        derives six explainable factors from raw signals
   -> Scoring engine       capability score minus soft penalties = net score
   -> Policy engine        hard flags that override the decision
   -> Decision engine      recommendation + decision confidence
   -> Decision trace       structured "why" (drivers, risks, reason)
        -> UI              renders the Health Card
        -> Narrator        (planned) rephrases the trace in natural language
```

The scoring, penalties, confidence, and decision are fully deterministic and live in `aegis-core.ts`. The language model is used only to phrase the already-decided output. It never computes a number or influences a decision. This keeps credit logic auditable and removes any path for a hallucinated value to reach a lending decision.

## Demo data

The prototype runs on three synthetic MSME profiles, each chosen to test a different behaviour:

- **Meher Components** is profitable but has no bureau file. The bureau rejects it; Aegis approves it on alternative signals.
- **Surya Traders** has a passable bureau score but inconsistent GST filing. Aegis declines it on a hard policy flag, showing the system does not approve on surface revenue alone.
- **Nila Foods** is borderline. It falls just below the approval line, with a clear, simulatable path to qualifying.

Aegis is designed to consume ULI- and Account-Aggregator-shaped data. The prototype uses synthetic profiles in place of a live sandbox connection.

Per-business descriptive metadata shown in the UI — annual turnover, GSTIN, industry, location, established year, and the relationship-manager identity — is **synthetic demo data** (`src/data/presentation.ts`). It is presentation chrome only: it lives outside the engine and the `EnrichedAssessment` contract, and no decision ever depends on it. Only the scored fields (factors, penalties, hard flags, the score equation, confidence) are computed by the engine.

## Running locally

Requires Node 18.18 or later (Node 20+ recommended).

```bash
npm install
npm test       # scoring-engine tests
npm run dev    # http://localhost:3000
```

Open the app, choose a business from the dashboard, and the Health Card renders from the live engine.

## Project structure

```
src/engine/aegis-core.ts            Pure scoring + decision engine (no UI, no IO)
src/engine/aegis-core.test.ts       Engine tests
src/engine/assessmentAdapter.ts     Lookup + assembles the API response
src/data/seeds.ts                   Synthetic MSME archetypes
src/view-models/healthCard.ts       Maps the engine decision to UI title/tone/colour
src/app/api/assessment/[id]/route.ts  Assessment endpoint
src/app/                            Landing, dashboard, business, simulator pages
src/components/health-card/         The Health Card and its sub-components
src/components/simulator/           What-If simulator panel and sliders
```

Imports use the `@/*` alias, which resolves to `src/*`.

The engine is kept as a standalone module so the data source can later be swapped from synthetic seeds to a ULI adapter without touching the decision logic.

## Tech stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest.

## Built

- What-If simulator: adjust receivables, GST filing, and vendor concentration and watch the decision recompute.

## Roadmap

- Natural-language narration of the decision trace.
- Live ULI / Account Aggregator integration in place of synthetic data.
- Portfolio-level view of how new approvals affect book quality.