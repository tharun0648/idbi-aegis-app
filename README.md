# Aegis

Aegis is an explainable credit-decision layer for MSME lending — a copilot for the underwriter, not an auto-approver. It works in both directions: rescuing thin-file good borrowers a bureau score rejects, and catching bureau-approvable bad actors the score alone would miss. The output is a Financial Health Card with every number traced back to the signal that produced it. Built for IDBI Innovate 2026, Problem Statement 3 (Financial Health Score).

## The problem

India has 7.1 crore Udyam-registered MSMEs; only about 3.3 crore are credit-active. Bureau scores were built for individuals with a repayment history, and MSME credit files are thin or nonexistent by nature of the business, not because the business is risky. The failure runs both ways: a profitable business with no bureau file gets an automatic rejection, while a business with a clean bureau score but an active default or a GST filing gap can look fine on paper. A single number can't hold both those cases — you need to see why.

## How it works

**A deterministic engine, not a model.** Six weighted factors (cash-flow stability, GST consistency, digital receipts, business stability, invoice health, seasonality) build a 100-point capability score. Soft penalties subtract from it. There's no LLM, no randomness, and no training data in this path — same input, same output, every time, in `src/engine/aegis-core.ts`.

**A hard flag beats any score.** An active default, a KYC mismatch, or a sustained GST filing gap forces `REFER_OR_DECLINE` regardless of how high the capability score is. This is a two-tier system on purpose: a business can be capable and still be a policy knockout, and no amount of capability buys past that.

**Alternative evidence lifts, it doesn't rescue.** Four optional operational signals — electricity trend, workforce trend, utility payment history, TReDS participation — can add up to +10 points on top of the core score, and only when they're positive. A bad signal contributes zero, never a deduction. This layer is inert whenever a hard flag is present, so it can move a borderline business over the approval line but it can never buy back a knockout.

## Live demo

**[idbi-aegis.vercel.app](https://idbi-aegis.vercel.app/)**

The dashboard has eight seeded businesses, each built to exercise a specific part of the decision logic:

| Seed | Business | Bureau | Aegis | Score | What it shows |
|---|---|---|---|---|---|
| Invisible Champion | Meher Components | No file (reject) | APPROVE | 82 | Thin file, bureau rejects; Aegis approves on operational strength. |
| The Mirage | Surya Traders | 720 (approvable) | REFER_OR_DECLINE | 29 | Bureau-approvable; Aegis catches a GST policy breach. |
| The Climber | Nila Foods | No file (borderline) | DECLINE_WITH_PATH | 48 | Below the line today; the simulator shows the exact path to APPROVE. |
| Prime Performer | Lakshmi Engineering | 780 (approvable) | APPROVE | 98 | Bureau-approvable; Aegis's deeper check confirms zero penalties. |
| On the Cusp | Anil Textiles | 690 (borderline) | CONDITIONAL | 52 | Bureau borderline; Aegis defines the exact terms for an approval. |
| Overextended | Vikram Logistics | 640 (reject) | REFER_OR_DECLINE | 90 | Strong surface metrics; a live default is a knockout no score buys past. |
| Identity Gap | Priya Exports | 710 (approvable) | REFER_OR_DECLINE | 81 | Bureau-approvable; Aegis catches a KYC identity mismatch the score misses. |
| Verified Operator | Kavya Textiles | No file (borderline) | APPROVE | 62 | Thin file lifted over the line by verified operational evidence (+7). |

Scores are `adjustedNetScore` where evidence applies, `netScore` where a hard flag is present (evidence never applies to a flagged file).

## Honest limitations

- **Synthetic data.** All eight profiles are hand-crafted seeds, not real MSME data pulled from any live source.
- **Hand-set weights.** The six factor weights (Cash-Flow 20, GST 18, Digital Receipts 16, Business Stability 16, Invoice Health 16, Seasonality 14) are team judgment calls, not derived from any dataset or model.
- **No live data integration.** In production, these signals would come from Account Aggregator, GSTN, BBPS, TReDS, and EPFO. None of those integrations exist here — the app reads synthetic seed profiles or a manually entered form.
- **No ULI/OCEN integration.** The OCEN 4.0 "Derived Data Partner" slot and an Account Aggregator consent flow are architectural targets this design assumes, not something wired up in this codebase.
- **The narrator is advisory only.** The Groq-generated business narrative is one paragraph of plain-English phrasing, clearly a rephrasing of a decision the engine already made. It does not and cannot affect the score or the recommendation — see `src/ai/narrator.ts`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS · Zod · Vitest · Groq (narrator only, optional) · Vercel

## Running locally

```bash
npm install
cp .env.example .env   # optional — add GROQ_API_KEY to enable the narrator
npm run dev             # http://localhost:3000
```

Requires Node 18.18+ (Node 20+ recommended). The app runs fully without `GROQ_API_KEY` — the narrator falls back to `null` and every page renders identically, since scoring never depends on it.

```bash
npm test          # 21 tests across the engine, adapter, schema, and narrator
npm run build     # production build
```

## Architecture note

The engine (`src/engine/aegis-core.ts`) is pure: no IO, no LLM, no persistence, no IDs. It takes an `MSMEProfile` and returns a `CoreAssessment`, and every other layer — seed lookup, the narrator, the API routes — sits around it without touching its math. Untrusted input is validated once, at the API boundary (`src/engine/profileSchema.ts`), before it ever reaches the engine; invalid input is rejected with per-field errors and the engine is never called. The narrator is feature-flagged on an API key and fails open on any error or timeout, so it's strictly additive — the app behaves the same with or without it. See `CLAUDE.md` for the full set of invariants and the data-flow pipeline.
