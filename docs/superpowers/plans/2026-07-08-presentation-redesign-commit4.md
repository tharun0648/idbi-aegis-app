# Aegis Presentation Redesign (Commit 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt a new color-token palette across the app, and add the presentation-layer pieces that don't exist yet (API `_debug` transparency data, a `TransparencyPanel`, mobile-responsive sidebar, a landing hero preview card, a 2-column dashboard grid, and a 5-step assess wizard) — without touching the engine, without duplicating pages that were already rebuilt in the last three commits.

**Architecture:** No changes to `src/engine/aegis-core.ts`, `src/engine/profileSchema.ts`, `simulate()`/`Lever`/seed data. All new work is presentation-layer (components, one adapter/route change to surface narrator debug data) or additive plumbing behind an optional parameter. The engine's one-way pipeline (`MSMEProfile → assess() → EnrichedAssessment → view-model → components`) is unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 3, lucide-react v1.23, Vitest.

## Global Constraints

- Do not touch `src/engine/aegis-core.ts`, `src/engine/profileSchema.ts`, `simulate()`, `Lever`, `applyLevers()`, or any seed data in `src/data/seeds.ts`.
- Do not remove or rename any field from the current `/api/assess` response (`{ ok: true, assessment }`) — only add a sibling `_debug` key.
- `npm run build` must be clean and all 17 existing tests (`src/engine/aegis-core.test.ts`, `src/engine/profileSchema.test.ts`) must keep passing after every task.
- No emoji anywhere in UI.
- Real `CoreAssessment` field names (do not use the stale names from the original design brief): `penalties` (not `softPenalties`), `alternativeEvidenceScore` (not `evidenceUplift`), `hardFlags` (not `flags`), `decisionConfidence: { score, band, reason }` (not a bare `confidence` number).
- Color-token decision (confirmed with the user): adopt the new hex palette below everywhere, replacing the current `#1F5E4A`/`#123A2E`/`#B7791F`/`#B42318` system. `src/view-models/healthCard.ts`'s `TONES` table and `src/presentation/verdict.tsx`'s `VERDICT_VISUAL` map stay the single source of truth for decision colors — edit only those two tables' values, per CLAUDE.md's freeze-boundary rule.
- Scope decision (confirmed with the user): pages 1–4 (landing, dashboard, assessment, simulator) keep their current structure/copy. Only add the specific gaps listed in Tasks 3–9. Do not rebuild markup that already exists and already matches the design brief's intent.
- **Superseded decision:** an earlier version of this plan dropped business name/turnover/industry/GSTIN/city from the wizard's Step 1 because they don't exist in `MSMEProfile`/`profileSchema.ts`. The user has since confirmed these should be reinstated as **decorative-only** fields with "source hint" copy (e.g. "From MCA / UDYAM registration") — local component state, never sent in the `/api/assess` payload, never validated by Zod, never part of `PROFILE_FIELD_ORDER`. Task 10 implements this. Do not let these fields leak into `toRaw()`, `validateProfile()`, or the Transparency Panel's Raw Input Profile table — that table stays engine-fields-only, matching the 17-field `PROFILE_FIELD_ORDER` exactly.
- Existing presentation components are extension points, not templates. When adding new UI, prefer extending existing components with optional props (e.g. `variant="compact"`, `showDebug`) rather than creating parallel implementations. Do not create duplicate versions of `HealthCard`, `ScoreEquation`, the verdict/color mapping, the sidebar, or any recommendation-display component — reuse the existing presentation primitives (this is why Task 6 adds a `variant` prop to the existing `ScoreEquation` instead of a new `LandingScoreEquation`/`CompactHealthCard` component).

### New color tokens

| Token | Hex | Role |
|---|---|---|
| `green-700` | `#15803d` | Decision "Approve" accent (replaces `#1F5E4A` in decision contexts) |
| `green-800` | `#166534` | Hover state for primary buttons |
| `orange-600` | `#ea580c` | Decision "Conditional" / "Path to yes" accent (replaces `#B7791F`) |
| `red-600` | `#dc2626` | Decision "Refer/Decline" accent, hard-flag/penalty red (replaces `#B42318`) |
| `brand-green` | `#1a4731` | Sidebar background, primary CTA background (replaces `#123A2E` as sidebar bg and `#1F5E4A` as button bg) |
| `brand-green-light` | `#f0fdf4` | Evidence-uplift tint (replaces `#F1F9F5`/`#ECF3F0` in evidence contexts) |
| `red-tint` | `#fef2f2` | Penalty / hard-flag tint (replaces `#FBF1EF`/`#FBEAE5`) |
| `grey-100` | `#f3f4f6` | Page background (replaces `#F8FAF9`) |
| `grey-50` | `#f9fafb` | Subtle internal fill (alternating table rows, nested meta boxes) |

`grey-200 #e5e7eb`, `grey-400 #9ca3af`, `grey-500 #6b7280`, `grey-900 #111827` already exactly match the current codebase's `#E5E7EB`/`#9CA3AF`/`#6B7280`/`#111827` — **no changes needed for those four**, do not touch borders/muted-text/primary-text literals.

**Derivation rule for tints/borders not explicitly given a token:** where the brief gives no explicit tint/border for a hue, derive it as an alpha suffix on the token itself (never invent an unrelated hex): `{accent}40` for a ~25%-alpha border, `{accent}1a` for a ~10%-alpha tint. This applies to `orange-600` (no tint token was given) and to the `border` cell of any tone table.

Resulting values to use everywhere below:
- Approve: ink `#166534`, accent `#15803d`, tint `#f0fdf4`, border `#15803d40`, line `#15803d`
- Conditional: ink `#ea580c`, accent `#ea580c`, tint `#ea580c1a`, border `#ea580c40`, line `#ea580c`
- Refer: ink `#dc2626`, accent `#dc2626`, tint `#fef2f2`, border `#dc262640`, line `#dc2626`

---

### Task 1: Recolor the two source-of-truth color tables

**Files:**
- Modify: `src/view-models/healthCard.ts:25-29` (the `TONES` table)
- Modify: `src/presentation/verdict.tsx:21-26` (the `VERDICT_VISUAL` map)

**Interfaces:**
- Consumes: nothing new.
- Produces: same `TONES`/`VERDICT_VISUAL` shapes as before (no type changes) — every component that reads `recommendationView()`/`VERDICT_VISUAL[rec]` picks up the new colors automatically, with zero component edits. This is the whole point of the freeze boundary.

- [ ] **Step 1: Update `TONES` in `src/view-models/healthCard.ts`**

Replace lines 25-29:

```ts
export const TONES: Record<Tone, ToneTokens> = {
  approve:     { ink: "#166534", accent: "#15803d", tint: "#f0fdf4", border: "#15803d40", line: "#15803d" },
  conditional: { ink: "#ea580c", accent: "#ea580c", tint: "#ea580c1a", border: "#ea580c40", line: "#ea580c" },
  refer:       { ink: "#dc2626", accent: "#dc2626", tint: "#fef2f2", border: "#dc262640", line: "#dc2626" },
};
```

- [ ] **Step 2: Update `VERDICT_VISUAL` in `src/presentation/verdict.tsx`**

Replace lines 21-26:

```ts
export const VERDICT_VISUAL: Record<Recommendation, VerdictVisual> = {
  APPROVE:           { icon: CheckCircle2,  color: "#15803d", tint: "#f0fdf4",   label: "Approve" },
  CONDITIONAL:       { icon: CircleAlert,   color: "#ea580c", tint: "#ea580c1a", label: "Conditional" },
  DECLINE_WITH_PATH: { icon: TrendingUp,    color: "#ea580c", tint: "#ea580c1a", label: "Path to yes" },
  REFER_OR_DECLINE:  { icon: AlertTriangle, color: "#dc2626", tint: "#fef2f2",   label: "Refer / Decline" },
};
```

Also update the header comment on line 12-13 to read `Colours: approve #15803d · conditional/path #ea580c · refer/flag #dc2626.`

- [ ] **Step 3: Run the existing test suite**

Run: `npx vitest run`
Expected: `Test Files 2 passed (2)`, `Tests 17 passed (17)` — these tables aren't exercised by the engine tests, so this just confirms nothing else broke.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, visit `/dashboard`, `/business/champion`, `/business/mirage`, `/business/climber`. Confirm: Champion (APPROVE) shows green `#15803d`, Mirage (REFER_OR_DECLINE, hard flag) shows red `#dc2626`, Climber (DECLINE_WITH_PATH) shows orange `#ea580c`.

- [ ] **Step 5: Commit**

```bash
git add src/view-models/healthCard.ts src/presentation/verdict.tsx
git commit -m "feat: adopt new green/orange/red decision color tokens"
```

---

### Task 2: Sweep remaining literal hex colors to the new palette

**Files:**
- Modify: `src/app/globals.css:7` (`--bg`)
- Modify: `src/components/shell/AppShell.tsx` (sidebar bg, page wrapper bg, button/hover colors — full mobile rework happens in Task 5, this task only recolors)
- Modify: `src/components/health-card/ScoreEquation.tsx:80-85` (`TONE` table) and its "decision" cell treatment
- Modify: `src/components/health-card/PenaltiesPanel.tsx` (penalty point color)
- Modify: `src/components/health-card/PolicyFlagsPanel.tsx` (hard-flag red + red-tint bg)
- Modify: `src/components/health-card/FactorsPanel.tsx`, `EvidencePanel.tsx` (green icon/value literals)
- Modify: `src/components/assess/ProfileForm.tsx` (submit button bg/hover, error red, evidence section tint)
- Modify: `src/components/simulator/WhatIfPanel.tsx`, `ScenarioSlider.tsx` (accent green, knockout red-tint box)
- Modify: `src/app/page.tsx` (landing CTA buttons)
- Modify: `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/KpiRow.tsx` (ghost button border/text — reads `VERDICT_VISUAL` already so KPI numbers are already fixed by Task 1; only the literal `#1F5E4A` ghost-button border/text needs updating here)
- Modify: `src/app/(app)/business/[id]/page.tsx` (breadcrumb hover, "Run What-If Simulator" button border/text)
- Modify: `src/components/health-card/MetaHeader.tsx` (icon background wash `#ECF3F0`→`#f0fdf4`, icon color `#1F5E4A`→`#1a4731`)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — pure literal-color replacement, no signatures change.

This task is a mechanical find/replace. Two literal colors carry different *semantic* meaning depending on where they appear, so replace by role, not by blind string match:

- **Decision-tone literals** (a hex that's standing in for "this IS approve/conditional/refer," e.g. hard-coded `#B42318` in `PenaltiesPanel`/`PolicyFlagsPanel`/`ScoreEquation`'s deduct tone) → `red-600 #dc2626`. Their light-tint pairs (`#FBEBE9`, `#FBF1EF`, `#F0DAD6`) → `red-tint #fef2f2` (bg) / `#dc262640` (border).
- **Generic brand-chrome literals** (`#1F5E4A` used for buttons, links, active icons, MetaHeader icon, simulator slider `accent-`, — i.e. "this is just the brand color," not standing in for a specific decision) → `brand-green #1a4731`. Their hover pairs (`#123A2E` used as a *hover* target, e.g. `ProfileForm`'s submit button `hover:bg-[#123A2E]`) → `green-800 #166534`.
- **Page/section background** `#F8FAF9` → `grey-100 #f3f4f6`.
- **Evidence-tint literals** (`#F1F9F5`, `#ECF3F0` when used for the evidence/verified-signal wash, not for a decision tone) → `brand-green-light #f0fdf4`.
- Leave every `#E5E7EB`, `#9CA3AF`, `#6B7280`, `#111827`, `#374151`, `#4B5563`, `#D1D5DB`, `#F1F3F2`, `#F3F4F6` literal untouched — those are structural greys, already correct or close enough to the grey-200/400/500/900 tokens and out of scope.

- [ ] **Step 1: `src/app/globals.css`**

Change line 7 from `--bg: #f8faf9;` to `--bg: #f3f4f6;`.

- [ ] **Step 2: `src/components/shell/AppShell.tsx`**

Line 30: `bg-[#F8FAF9]` → `bg-[#f3f4f6]`.
Line 31: `bg-[#123A2E]` → `bg-[#1a4731]`.
Line 34: `border-white/15 bg-white/5` unchanged.
Line 54: `bg-[#1F5E4A] text-white` (active nav bg) unchanged for now — Task 5 replaces this whole active-state treatment with `bg-white/20` per the mobile-nav spec, don't duplicate the edit here.
Line 77: `bg-[#1F5E4A]` (RM avatar circle) → `bg-[#1a4731]`.

- [ ] **Step 3: `src/components/health-card/ScoreEquation.tsx`**

Replace the `TONE` table (lines 80-85):

```ts
const TONE: Record<Tone, { card: string; icon: string; iconBg: string; value: string; label: string }> = {
  default:  { card: "border border-[#E5E7EB] bg-white",     icon: "#1a4731", iconBg: "#f0fdf4",   value: "#111827", label: "#6B7280" },
  deduct:   { card: "border border-[#dc262640] bg-[#fef2f2]", icon: "#dc2626", iconBg: "#fef2f2",   value: "#dc2626", label: "#6B7280" },
  evidence: { card: "border border-[#15803d40] bg-[#f0fdf4]", icon: "#15803d", iconBg: "#f0fdf4",   value: "#15803d", label: "#4B5563" },
  decision: { card: "border-2 border-[#1a4731] bg-white",     icon: "#1a4731", iconBg: "#f0fdf4",   value: "#1a4731", label: "#6B7280" },
};
```

Note the `decision` tone changes shape here per the design brief's explicit ask ("Adjusted Score: border-brand-green (2px), bg-white — this is the decision box, make it stand out") — it was previously a solid dark-filled cell (`bg-[#123A2E]`, white text). Since `onDark` in `EquationCell` (line 90) checked `cell.tone === "decision"` to decide label/foot text color for a dark background, update that logic too: replace lines 90-104 —

```tsx
function EquationCell({ cell }: { cell: Cell }) {
  const t = TONE[cell.tone];
  const Icon = cell.icon;
  return (
    <div className={`flex min-w-[168px] flex-1 flex-col rounded-lg p-4 ${t.card}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: t.iconBg }}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: t.icon }} />
      </span>
      <p className="mt-3 text-xs font-medium leading-tight" style={{ color: t.label }}>
        {cell.label}
        <span className="block font-normal opacity-80">({cell.sub})</span>
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: t.value }}>
        {cell.value}
        <span className="text-sm font-normal text-[#9CA3AF]"> / 100</span>
      </p>
      <p className="mt-1 text-[11px] leading-tight text-[#9CA3AF]">{cell.foot}</p>
    </div>
  );
}
```

(All cells now render on a white/tinted background, so the `onDark` branch and its `#7FA99B` text are dead code — remove them.)

- [ ] **Step 4: `src/components/health-card/PenaltiesPanel.tsx`**

Line 15: `text-[#B42318]` → `text-[#dc2626]`.
Lines 30, 36: `text-[#B42318]` → `text-[#dc2626]` (both the per-row point value and the total).

- [ ] **Step 5: `src/components/health-card/PolicyFlagsPanel.tsx`**

Line 16: `border-[#F0DAD6] bg-[#FBF1EF]` → `border-[#dc262640] bg-[#fef2f2]`.
Line 20 (clean state icon) stays green — update `text-[#1F5E4A]` → `text-[#15803d]`.
Line 21: `text-[#B42318]` → `text-[#dc2626]`.
Lines 36-38: `border-[#B42318]`, `text-[#7A2615]` (×2), `text-[#B42318]` → `border-[#dc2626]`, `text-[#dc2626]` (keep the two shades collapsed to one — no separate "dark ink" token was given for red), `text-[#dc2626]`.
Line 29: `text-[#14532D]` (×2) → `text-[#15803d]`.

- [ ] **Step 6: `src/components/health-card/FactorsPanel.tsx` and `EvidencePanel.tsx`**

`FactorsPanel.tsx` line 18: `text-[#1F5E4A]` → `text-[#15803d]`.
`EvidencePanel.tsx` line 25: `text-[#1F5E4A]` → `text-[#15803d]`. Line 35: `bg-[#ECF3F0]` → `bg-[#f0fdf4]`. Line 36: `text-[#1F5E4A]` → `text-[#15803d]`. Line 42: `color: r.contribution > 0 ? "#1F5E4A" : "#9CA3AF"` → `"#15803d"`. Line 52: `text-[#1F5E4A]` → `text-[#15803d]`.

- [ ] **Step 7: `src/components/health-card/MetaHeader.tsx`**

Line 31: `bg-[#ECF3F0]` → `bg-[#f0fdf4]`. Line 32: `text-[#1F5E4A]` → `text-[#1a4731]`. Lines 68-74 (Decision Confidence card, hardcoded green, not decision-driven since it's always shown regardless of tone) — `border-[#CDE6DC] bg-[#F1F9F5]` → `border-[#1a473140] bg-[#f0fdf4]`; `text-[#1F5E4A]` (×2, band value + ShieldCheck icon) → `text-[#1a4731]`.

- [ ] **Step 8: `src/components/assess/ProfileForm.tsx`**

Line 241: `focus:border-[#1F5E4A] focus:ring-[#1F5E4A]/15` → `focus:border-[#1a4731] focus:ring-[#1a4731]/15`.
Line 242: `border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/15` → `border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/15`.
Lines 261, 350, 375: `accent-[#1F5E4A]` / `hover:border-[#1F5E4A]` → `accent-[#1a4731]` / `hover:border-[#1a4731]`.
Line 287, 301, 317, 341, 412: `text-[#B42318]` (field error messages) → `text-[#dc2626]`.
Line 390: `border-[#CDE6DC] bg-[#F1F9F5]` (operational evidence section) → `border-[#1a473140] bg-[#f0fdf4]`.
Line 420: `border-[#F0DAD6] bg-[#FBF1EF]` / `text-[#7A2615]` (form error banner) → `border-[#dc262640] bg-[#fef2f2]` / `text-[#dc2626]`.
Line 427: `bg-[#1F5E4A]` / `hover:bg-[#123A2E]` → `bg-[#1a4731]` / `hover:bg-[#166534]`.
Line 431: `text-[#B42318]` → `text-[#dc2626]`.
Line 440: `text-[#1F5E4A]` → `text-[#1a4731]`.

- [ ] **Step 9: `src/components/simulator/WhatIfPanel.tsx` and `ScenarioSlider.tsx`**

`WhatIfPanel.tsx` line 73: `deltaColor` — `"#1F5E4A"`/`"#B42318"` → `"#15803d"`/`"#dc2626"` (this one IS decision-driven — positive delta = good/green, negative = bad/red — keep the semantic red/green but on new hex).
Lines 148, 156: `text-[#1F5E4A]` → `text-[#15803d]`; `border-[#F0DAD6] bg-[#FBF1EF]` (knockout box) → `border-[#dc262640] bg-[#fef2f2]`; `text-[#7A2615]` (×2) → `text-[#dc2626]`.
`ScenarioSlider.tsx` line 40: `accent-[#1F5E4A]` → `accent-[#1a4731]`.

While in `WhatIfPanel.tsx`, also add the missing advisory footer note from the design brief (page 4, "Right panel — Live Preview" footer) — it's a one-line addition, not yet present. Add it right after the closing `</aside>` (after line 165), before the "the SAME Health Card" comment block:

```tsx
      </aside>

      <p className="text-xs italic text-[#9CA3AF] lg:hidden">
        Note: Simulator re-runs the full engine on every change. Results are indicative and for advisory only.
      </p>

      {/* the SAME Health Card, re-scored live */}
```

(shown only on mobile via `lg:hidden` here because the two-column desktop layout already has room in the right panel — add it non-conditionally, i.e. drop `lg:hidden`, if you'd rather it always show; either is fine, just don't duplicate it twice.)

- [ ] **Step 10: `src/app/page.tsx` (landing)**

Lines 46, 67, 136: `bg-[#1F5E4A]` (brand icon square, both CTA buttons) → `bg-[#1a4731]`, and change `hover:opacity-90` to `hover:bg-[#166534]` on both CTA `<Link>`s so the hover-state token is actually used.
Line 56: `text-[#1F5E4A]` (eyebrow) → `text-[#1a4731]`.
Line 91: `bg-[#ECF3F0]` (moat icon bg) → `bg-[#f0fdf4]`. Line 92: `text-[#1F5E4A]` → `text-[#1a4731]`.
Line 115: `text-[#1F5E4A]` → `text-[#1a4731]`.

- [ ] **Step 11: `src/app/(app)/dashboard/page.tsx`**

Line 22: `border-[#1F5E4A]`, `text-[#1F5E4A]` (ghost button) → `border-[#1a4731]`, `text-[#1a4731]`.
Line 70: `text-[#1F5E4A]` ("Evaluate →") → `text-[#1a4731]`.
Line 42: `hover:border-[#1F5E4A]` → `hover:border-[#1a4731]`.

- [ ] **Step 12: `src/app/(app)/business/[id]/page.tsx`**

Line 27: `hover:text-[#111827]` unchanged (already a grey token).
Line 34: `text-[#1F5E4A]`, `hover:border-[#1F5E4A]` → `text-[#1a4731]`, `hover:border-[#1a4731]`.
Line 42: `text-[#B42318]` (error state) → `text-[#dc2626]`.

- [ ] **Step 13: Run the full test suite and build**

Run: `npx vitest run` — expect 17/17 passing.
Run: `npm run build` — expect a clean build with zero type errors (the `ScoreEquation.tsx` `EquationCell` signature didn't change, so no callers need updates).

- [ ] **Step 14: Manual browser check**

`npm run dev`. Visit `/`, `/dashboard`, `/business/champion`, `/business/mirage`, `/assess`, `/simulator/climber`. Confirm no leftover `#1F5E4A`/`#123A2E`/`#B7791F`/`#B42318`/`#F8FAF9` visually (spot-check DevTools computed styles on a button and the sidebar if unsure) and that the assessment page's "Adjusted Net Score" cell now renders as a white card with a 2px brand-green border rather than a solid dark-filled cell.

- [ ] **Step 15: Commit**

```bash
git add src/app/globals.css src/components/shell/AppShell.tsx src/components/health-card/ src/components/assess/ProfileForm.tsx src/components/simulator/ src/app/page.tsx "src/app/(app)/dashboard/page.tsx" "src/app/(app)/business/[id]/page.tsx"
git commit -m "feat: sweep remaining literal colors to the new palette"
```

---

### Task 3: Add `_debug` to `POST /api/assess` (narrator trace plumbing)

**Files:**
- Modify: `src/ai/narrator.ts` (add an optional trace out-param to `narrate()`)
- Modify: `src/engine/assessmentAdapter.ts` (thread an optional trace through `assessAdHoc()`)
- Create: `src/types/debug.ts` (the shared `AssessDebug` type — route handlers expose HTTP behavior, not a type library, so this type does NOT live in `route.ts`; both the route and every UI consumer import it from here)
- Modify: `src/app/api/assess/route.ts` (build and return `_debug`, dev-only)
- Test: `src/ai/narrator.test.ts` (new)
- Test: `src/engine/assessmentAdapter.test.ts` (new)

**Interfaces:**
- Produces: `export interface NarratorTrace { model: string | null; prompt: string | null; response: string | null; }` in `src/ai/narrator.ts`, and `export interface AssessDebug { rawProfile: MSMEProfile; engineOutputs: { capabilityScore: number; penalties: Penalty[]; netScore: number; alternativeEvidenceScore: number; adjustedNetScore: number; hardFlags: HardFlag[]; recommendation: Recommendation; decisionConfidence: DecisionConfidence }; narratorModel: string | null; narratorPrompt: string | null; narratorResponse: string | null; }` in `src/types/debug.ts` — this is the type Task 4's `TransparencyPanel` (and Task 10's wizard) will import. `route.ts` imports it too; it does not declare it.
- Consumes: `CoreAssessment`, `MSMEProfile`, `Penalty`, `HardFlag`, `Recommendation`, `DecisionConfidence` from `@/engine/aegis-core` (all already exported).

- [ ] **Step 1: Write the failing test for `narrate()`'s trace param**

Create `src/ai/narrator.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { narrate, type NarratorTrace } from "@/ai/narrator";
import { assess } from "@/engine/aegis-core";
import { SEEDS } from "@/data/seeds";

describe("narrate() trace param", () => {
  const originalKey = process.env.GROQ_API_KEY;
  beforeEach(() => { delete process.env.GROQ_API_KEY; });
  afterEach(() => { if (originalKey) process.env.GROQ_API_KEY = originalKey; });

  it("no API key: returns null and leaves trace fields null", async () => {
    const core = assess(SEEDS.champion.profile);
    const meta = { id: "custom", businessName: "x", archetype: "y", emoji: "", bureauScore: null, bureauVerdict: "Not pulled" };
    const trace: NarratorTrace = { model: null, prompt: null, response: null };

    const text = await narrate(core, meta, trace);

    expect(text).toBeNull();
    expect(trace.prompt).toBeNull();
    expect(trace.response).toBeNull();
    expect(trace.model).toBeNull();
  });

  it("is backward compatible when no trace is passed", async () => {
    const core = assess(SEEDS.champion.profile);
    const meta = { id: "champion", businessName: "x", archetype: "y", emoji: "", bureauScore: null, bureauVerdict: "reject" };
    await expect(narrate(core, meta)).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ai/narrator.test.ts -v`
Expected: FAIL — `NarratorTrace` is not exported / `narrate` doesn't accept a third argument yet (TS type error or runtime signature mismatch, since `trace.prompt` would just stay whatever was passed in and never get populated to `null` if `narrate` doesn't touch it — actually since the test seeds `trace` with `null` values already, this specific test would trivially pass even before the change since nothing mutates it. Rely primarily on the TypeScript compiler catching the missing export/param — confirm by running `npx tsc --noEmit` and checking for an error on the `NarratorTrace` import.)

Run: `npx tsc --noEmit`
Expected: error `Module '"@/ai/narrator"' has no exported member 'NarratorTrace'.`

- [ ] **Step 3: Implement the trace param in `src/ai/narrator.ts`**

Add the exported interface near the top (after the existing type alias on line 34):

```ts
export interface NarratorTrace {
  model: string | null;
  prompt: string | null;
  response: string | null;
}
```

Replace the `narrate` function (lines 36-67) with:

```ts
export async function narrate(
  core: CoreAssessment,
  business: BusinessMeta,
  trace?: NarratorTrace,
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null; // feature flag: no key → deterministic render, as today

  const cacheable = business.id !== "custom";
  if (cacheable) {
    const hit = cache.get(business.id);
    if (hit) return hit;
  }

  const userPrompt = buildUserPrompt(core, business);
  if (trace) trace.prompt = userPrompt;

  try {
    // Lazy import keeps the SDK off the no-key path and out of the client bundle.
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL, timeout: TIMEOUT_MS, maxRetries: 0 });

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ];

    let modelUsed = PRIMARY_MODEL;
    const raw = await complete(client, PRIMARY_MODEL, messages).catch((err) => {
      if (!isModelUnavailable(err)) return Promise.reject(err);
      modelUsed = FALLBACK_MODEL;
      return complete(client, FALLBACK_MODEL, messages);
    });

    if (trace) { trace.model = modelUsed; trace.response = raw; }

    const text = sanitize(raw);
    if (!text) return null;
    if (cacheable) cache.set(business.id, text); // never cache failures
    return text;
  } catch {
    return null; // any error/timeout → deterministic fallback, never throws
  }
}
```

Note: on the no-key early return (line 2 of the function), `trace.prompt` is deliberately left at whatever the caller initialized it to (never populated) — this matches the test above and correctly signals "narrator never ran" rather than fabricating a prompt that was never sent.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ai/narrator.test.ts -v`
Expected: PASS (2 tests).
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Write the failing test for `assessAdHoc`'s trace threading**

Create `src/engine/assessmentAdapter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { assessAdHoc } from "@/engine/assessmentAdapter";
import type { NarratorTrace } from "@/ai/narrator";
import { EXAMPLE_DEFAULT_PROFILE } from "@/engine/profileSchema";

describe("assessAdHoc narrator trace threading", () => {
  it("accepts an optional trace and doesn't alter the returned assessment", async () => {
    const trace: NarratorTrace = { model: null, prompt: null, response: null };
    const withTrace = await assessAdHoc(EXAMPLE_DEFAULT_PROFILE, trace);
    const withoutTrace = await assessAdHoc(EXAMPLE_DEFAULT_PROFILE);

    expect(withTrace.netScore).toBe(withoutTrace.netScore);
    expect(withTrace.recommendation).toBe(withoutTrace.recommendation);
    expect(withTrace.business.id).toBe("custom");
    // No GROQ_API_KEY in the test env → narrator never ran → trace stays empty.
    expect(trace.prompt).toBeNull();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx tsc --noEmit`
Expected: error — `assessAdHoc` doesn't accept a second argument yet.

- [ ] **Step 7: Implement trace threading in `src/engine/assessmentAdapter.ts`**

Add the import (line 3): `import { narrate, type NarratorTrace } from "@/ai/narrator";`

Replace `assessAdHoc` (lines 90-97):

```ts
export async function assessAdHoc(profile: MSMEProfile, narratorTrace?: NarratorTrace): Promise<EnrichedAssessment> {
  const core: CoreAssessment = assess(profile);
  return {
    ...core,
    business: AD_HOC_META,
    businessNarrative: await narrate(core, AD_HOC_META, narratorTrace),
  };
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/engine/assessmentAdapter.test.ts -v`
Expected: PASS.
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Create the shared `AssessDebug` type in `src/types/debug.ts`**

Create `src/types/debug.ts`:

```ts
import type { MSMEProfile, Penalty, HardFlag, Recommendation, DecisionConfidence } from "@/engine/aegis-core";

/**
 * The shape of the `_debug` field returned by POST /api/assess (development
 * only — see route.ts). Lives outside the route so UI consumers (Transparency
 * Panel, the assess wizard) import a plain type module, not a route handler.
 */
export interface AssessDebug {
  rawProfile: MSMEProfile;
  engineOutputs: {
    capabilityScore: number;
    penalties: Penalty[];
    netScore: number;
    alternativeEvidenceScore: number;
    adjustedNetScore: number;
    hardFlags: HardFlag[];
    recommendation: Recommendation;
    decisionConfidence: DecisionConfidence;
  };
  narratorModel: string | null;
  narratorPrompt: string | null;
  narratorResponse: string | null;
}
```

- [ ] **Step 10: Add `_debug` to the route, development-only**

Replace `src/app/api/assess/route.ts` in full:

```ts
import { NextResponse } from "next/server";
import { validateProfile } from "@/engine/profileSchema";
import { assessAdHoc } from "@/engine/assessmentAdapter";
import type { NarratorTrace } from "@/ai/narrator";
import type { AssessDebug } from "@/types/debug";

/**
 * POST /api/assess  —  body: a raw MSMEProfile (untrusted).
 * The boundary re-validates (the client validates too; this is authoritative),
 * then runs the engine + server-side narrator. On invalid input → 400 with
 * per-field errors and the engine is never called.
 */

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { _form: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  const result = validateProfile(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  const narratorTrace: NarratorTrace = { model: null, prompt: null, response: null };
  const assessment = await assessAdHoc(result.profile, narratorTrace);

  // _debug is development-only: it carries the raw profile and the narrator's
  // prompt/response text, which are useful for building/demoing the
  // Transparency Panel but should never leave a production response.
  if (process.env.NODE_ENV === "development") {
    const _debug: AssessDebug = {
      rawProfile: result.profile,
      engineOutputs: {
        capabilityScore: assessment.capabilityScore,
        penalties: assessment.penalties,
        netScore: assessment.netScore,
        alternativeEvidenceScore: assessment.alternativeEvidenceScore,
        adjustedNetScore: assessment.adjustedNetScore,
        hardFlags: assessment.hardFlags,
        recommendation: assessment.recommendation,
        decisionConfidence: assessment.decisionConfidence,
      },
      narratorModel: narratorTrace.model,
      narratorPrompt: narratorTrace.prompt,
      narratorResponse: narratorTrace.response,
    };
    return NextResponse.json({ ok: true, assessment, _debug });
  }

  return NextResponse.json({ ok: true, assessment });
}
```

- [ ] **Step 11: Write the engine-freeze regression test**

Add to `src/engine/assessmentAdapter.test.ts` (created in Step 5) a second test that proves the `_debug`/narrator-trace plumbing never alters deterministic engine output — the whole point of the freeze boundary. Add `import { assess } from "@/engine/aegis-core";` to the file's existing top-of-file import block (alongside the three imports from Step 5), then add this test inside the same `describe` block as the trace-threading test:

```ts
it("engine-freeze regression: assessAdHoc's engine fields exactly match a direct assess() call", async () => {
  const trace: NarratorTrace = { model: null, prompt: null, response: null };
  const viaAdapter = await assessAdHoc(EXAMPLE_DEFAULT_PROFILE, trace);
  const direct = assess(EXAMPLE_DEFAULT_PROFILE);

  // Compare every deterministic engine field field-by-field (excluding the
  // adapter-added business/businessNarrative keys, which assess() doesn't return).
  expect(viaAdapter.factors).toEqual(direct.factors);
  expect(viaAdapter.penalties).toEqual(direct.penalties);
  expect(viaAdapter.hardFlags).toEqual(direct.hardFlags);
  expect(viaAdapter.capabilityScore).toBe(direct.capabilityScore);
  expect(viaAdapter.netScore).toBe(direct.netScore);
  expect(viaAdapter.alternativeEvidenceScore).toBe(direct.alternativeEvidenceScore);
  expect(viaAdapter.adjustedNetScore).toBe(direct.adjustedNetScore);
  expect(viaAdapter.altEvidence).toEqual(direct.altEvidence);
  expect(viaAdapter.recommendation).toBe(direct.recommendation);
  expect(viaAdapter.decisionConfidence).toEqual(direct.decisionConfidence);
  expect(viaAdapter.decisionTrace).toEqual(direct.decisionTrace);
  expect(viaAdapter.improvementPlan).toEqual(direct.improvementPlan);
});
```

Run: `npx vitest run src/engine/assessmentAdapter.test.ts -v`
Expected: PASS (3 tests in this file now).

- [ ] **Step 12: Run the full suite and manual curl check**

Run: `npx vitest run` — expect 17 + 4 new = 21 tests passing (2 in `narrator.test.ts`, 2 in `assessmentAdapter.test.ts`).
Run: `npm run build` — clean.
Run `npm run dev` (this runs in development mode, so `NODE_ENV === "development"` and `_debug` is present — that's the mode these checks exercise) in one terminal, then in another:

```bash
curl -s -X POST http://localhost:3000/api/assess -H "Content-Type: application/json" -d '{"gstOnTimeRate": 5}' | head -c 300
```
Expected: `{"ok":false,"errors":{"gstOnTimeRate":"GST on-time rate must be between 0 and 1."...` (engine never called, no `_debug`).

```bash
curl -s -X POST http://localhost:3000/api/assess -H "Content-Type: application/json" -d '{"cashflowTrend":"stable","gstOnTimeRate":0.9,"gstMaxGapCycles":0,"gstLastCycleLate":false,"digitalReceiptsShare":0.88,"digitalHistoryMonths":5,"yearsOperating":4,"avgReceivableDays":32,"topVendorShare":22,"seasonality":"low","seasonalCashDip":false,"activeDefault":false,"kycMismatch":false}' | python3 -m json.tool | head -40
```
Expected: response includes top-level `_debug.rawProfile`, `_debug.engineOutputs`, `_debug.narratorModel`/`narratorPrompt`/`narratorResponse` (all `null` since no `GROQ_API_KEY` is set locally, unless the dev's `.env` has one — either is fine, just confirm the keys exist and are consistent: all three null together, or all three populated together). Note this `_debug` key only appears because `npm run dev` sets `NODE_ENV=development`; a production build (`npm run build && npm start`) must NOT include it — spot-check this in Task 10.

- [ ] **Step 13: Commit**

```bash
git add src/ai/narrator.ts src/ai/narrator.test.ts src/engine/assessmentAdapter.ts src/engine/assessmentAdapter.test.ts src/app/api/assess/route.ts src/types/debug.ts
git commit -m "feat: surface narrator prompt/response and engine outputs via dev-only _debug on POST /api/assess"
```

---

### Task 4: `TransparencyPanel` component, wired into the assess-form result view

**Files:**
- Create: `src/constants/profileFields.ts` (the single, shared `PROFILE_FIELD_ORDER` — do not redefine this array anywhere else; Task 10's Review step reuses this exact constant)
- Create: `src/components/TransparencyPanel.tsx`
- Modify: `src/components/assess/ProfileForm.tsx` (render it below the result `HealthCard`, only for the ad-hoc flow — this is the only place `_debug` exists)

**Interfaces:**
- Consumes: `AssessDebug` type from `@/types/debug` (added in Task 3), `MSMEProfile` from `@/engine/aegis-core`.
- Produces: `export const PROFILE_FIELD_ORDER: ReadonlyArray<keyof MSMEProfile>` in `src/constants/profileFields.ts`; `export default function TransparencyPanel({ debug }: { debug: AssessDebug })`.

- [ ] **Step 1: Create `src/constants/profileFields.ts`**

This is the one place the 17-field order is defined. Task 10's Review step imports this same constant — do not let a second, hand-copied field list drift out of sync with it.

```ts
import type { MSMEProfile } from "@/engine/aegis-core";

export const PROFILE_FIELD_ORDER: ReadonlyArray<keyof MSMEProfile> = [
  "cashflowTrend", "gstOnTimeRate", "gstMaxGapCycles", "gstLastCycleLate",
  "digitalReceiptsShare", "digitalHistoryMonths", "yearsOperating", "avgReceivableDays",
  "topVendorShare", "seasonality", "seasonalCashDip", "activeDefault", "kycMismatch",
  "electricityTrend", "workforceTrend", "utilityPayment", "tredsHistory",
];
```

- [ ] **Step 2: Create `src/components/TransparencyPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Terminal, ChevronDown } from "lucide-react";
import type { AssessDebug } from "@/types/debug";
import { PROFILE_FIELD_ORDER } from "@/constants/profileFields";

function fmt(v: unknown): string {
  if (v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * Collapsible accordion showing the exact inputs/outputs/narrator payload that
 * produced this assessment. Closed by default. Renders only what the API
 * actually returned in `_debug` — no placeholder rows, no invented data.
 */
export default function TransparencyPanel({ debug }: { debug: AssessDebug }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex min-h-[44px] w-full items-center gap-3 px-6 py-4 text-left"
        aria-expanded={open}
      >
        <Terminal className="h-[18px] w-[18px] shrink-0 text-[#6B7280]" strokeWidth={1.75} />
        <span className="text-sm font-medium text-[#374151]">Engine Computation Log</span>
        <span className="hidden text-xs text-[#9CA3AF] sm:inline">View raw inputs, scores, and narrator payload</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div className="divide-y divide-[#F1F3F2] border-t border-[#E5E7EB]">
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Raw Input Profile</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">These are the 13 signals submitted to the Aegis engine.</p>
            <table className="mt-3 w-full border-collapse text-xs font-mono">
              <tbody>
                {PROFILE_FIELD_ORDER.map((key, i) => (
                  <tr key={key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                    <td className="px-3 py-1.5 text-[#6B7280]">{key}</td>
                    <td className="px-3 py-1.5 text-[#111827]">{fmt(debug.rawProfile[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Engine Outputs</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Computed deterministically. No model involved.</p>
            <table className="mt-3 w-full border-collapse text-xs font-mono">
              <tbody>
                {(Object.entries(debug.engineOutputs) as Array<[string, unknown]>).map(([key, value], i) => (
                  <tr key={key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                    <td className="px-3 py-1.5 align-top text-[#6B7280]">{key}</td>
                    <td className="px-3 py-1.5 text-[#111827]">{fmt(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Narrator</p>
            {debug.narratorResponse === null ? (
              <p className="mt-2 text-sm text-[#6B7280]">Narrator fallback active — static text used.</p>
            ) : (
              <>
                <p className="mt-2 text-xs font-mono text-[#6B7280]">Model: {debug.narratorModel}</p>
                <p className="mt-3 text-xs font-medium text-[#374151]">Prompt sent:</p>
                <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-[#f9fafb] p-3 text-xs font-mono text-[#6B7280]">
                  {debug.narratorPrompt}
                </pre>
                <p className="mt-3 text-xs font-medium text-[#374151]">Response received:</p>
                <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-[#f9fafb] p-3 text-xs font-mono text-[#6B7280]">
                  {debug.narratorResponse}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Wire it into `ProfileForm.tsx`**

The current `onSubmit` (lines 205-238) discards everything except `data.assessment`. Change the state and submit handler to keep `_debug` too.

Add the import (near line 9): `import type { AssessDebug } from "@/types/debug";` and `import TransparencyPanel from "@/components/TransparencyPanel";`

Add a new state field near line 191: `const [debug, setDebug] = useState<AssessDebug | null>(null);`

In `onSubmit`, replace line 231 (`setResult(data.assessment as EnrichedAssessment);`) with:

```ts
      setResult(data.assessment as EnrichedAssessment);
      setDebug(data._debug as AssessDebug ?? null);
```

(the `?? null` matters here: in production `_debug` is absent from the response per Task 3's dev-only gate, so `data._debug` is `undefined` — normalize it to `null` so `TransparencyPanel` simply doesn't render rather than being handed `undefined`.)

And in the failure branches (lines 226-229 and 232-234), add `setDebug(null);` alongside the existing `setResult(null);` calls so a failed re-submit doesn't show stale debug data.

Replace the result block (lines 437-444):

```tsx
      {result && (
        <section className="space-y-4">
          <div className="mb-4 border-t border-[#E5E7EB] pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#1a4731]">Live engine result</p>
          </div>
          <HealthCard a={result} />
          {debug && <TransparencyPanel debug={debug} />}
        </section>
      )}
```

- [ ] **Step 4: Run build and tests**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npx vitest run` — expect the same 21 tests passing (no engine tests touch this component).
Run: `npm run build` — expect a clean build.

- [ ] **Step 5: Manual browser check**

`npm run dev`, visit `/assess`, submit the default example. Confirm: the "Engine Computation Log" accordion appears below the Health Card, closed by default; clicking it expands to show all 3 sections with real submitted values (not placeholders) — cross-check a field like `avgReceivableDays` in the table matches what you actually entered.

- [ ] **Step 6: Commit**

```bash
git add src/constants/profileFields.ts src/components/TransparencyPanel.tsx src/components/assess/ProfileForm.tsx
git commit -m "feat: add collapsible Engine Computation Log to the assess-form result"
```

---

### Task 5: Mobile-responsive sidebar (hamburger + drawer)

**Files:**
- Modify: `src/components/shell/AppShell.tsx` (split into a desktop sidebar + mobile top bar + drawer, all in one client component — no new file needed since `AppShell` is already `"use client"`)

**Interfaces:**
- Consumes: existing `NAV`, `APP_VERSION`, `RELATIONSHIP_MANAGER` — unchanged.
- Produces: same `export default function AppShell({ children })` signature — no caller changes needed (`src/app/(app)/layout.tsx` is untouched).

- [ ] **Step 1: Replace `src/components/shell/AppShell.tsx` in full**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, LayoutDashboard, ClipboardCheck, TrendingUp, Info, LogOut, ChevronDown, Menu, X,
  type LucideIcon,
} from "lucide-react";
import { APP_VERSION, RELATIONSHIP_MANAGER } from "@/data/presentation";

/**
 * APP SHELL — persistent left sidebar (desktop) / hamburger + drawer (mobile).
 * Wraps every /(app) route via the route-group layout; the public landing at
 * "/" renders WITHOUT it. Presentation only — no data, no scoring.
 */

interface NavItem { href: string; label: string; icon: LucideIcon; isActive: (path: string) => boolean; }

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, isActive: p => p.startsWith("/dashboard") || p.startsWith("/business") },
  { href: "/assess", label: "Assess Business", icon: ClipboardCheck, isActive: p => p.startsWith("/assess") },
  { href: "/simulator/climber", label: "Simulator (What-If)", icon: TrendingUp, isActive: p => p.startsWith("/simulator") },
  { href: "/", label: "About Aegis", icon: Info, isActive: () => false },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5">
          <Shield className="h-5 w-5 text-white" strokeWidth={1.75} />
        </span>
        <div className="leading-tight">
          <p className="text-lg font-semibold tracking-tight text-white">AEGIS</p>
          <p className="text-xs text-[#8FB3A7]">MSME Credit Intelligence</p>
        </div>
      </div>

      <nav className="mt-2 space-y-1 px-3">
        {NAV.map(item => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-6 pb-5 pt-6">
        <div className="flex items-center gap-2 text-white">
          <Shield className="h-4 w-4" strokeWidth={1.75} />
          <p className="text-sm font-semibold">Deterministic Engine</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/70">100-point Core · Explainable Decisions</p>
        <p className="mt-3 text-xs text-white/70">Version {APP_VERSION}</p>
        <p className="text-xs text-white/70">© 2025 Aegis by IDBI Innovate</p>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">RM</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-white">{RELATIONSHIP_MANAGER.name}</p>
            <p className="truncate text-xs text-white/80">{RELATIONSHIP_MANAGER.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/70" strokeWidth={1.75} />
        </div>

        <button
          type="button"
          className="mt-2 flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Log out
        </button>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6] md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#1a4731] text-white/70 md:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <header className="flex min-h-[56px] items-center justify-between border-b border-[#E5E7EB] bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="flex h-11 w-11 items-center justify-center text-[#374151]"
        >
          <Menu className="h-6 w-6" strokeWidth={1.75} />
        </button>
        <span className="text-base font-semibold tracking-tight text-[#111827]">AEGIS</span>
        <span className="h-11 w-11" aria-hidden />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex h-full w-72 max-w-[80vw] flex-col bg-[#1a4731]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-white/80"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
```

Notes on this rewrite: the desktop `<aside>` keeps the exact same visual content as before (Task 2 already recolored `#123A2E`→brand-green and the active-nav bg to `white/20`, which this step folds in directly rather than duplicating edits); `SidebarContent` is extracted so drawer and desktop render identically. All interactive elements (`Menu`/`X`/nav `Link`s/`Log out` button) meet the `min-h-[44px]`/`h-11 w-11` (44px) touch-target rule.

- [ ] **Step 2: Run build and tests**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npx vitest run` — expect the same 21 tests passing.
Run: `npm run build` — expect a clean build.

- [ ] **Step 3: Manual browser check at three breakpoints**

`npm run dev`. In DevTools responsive mode:
- At 1280px: sidebar visible full-height on the left, no hamburger, no horizontal scroll.
- At 768px: sidebar hidden, hamburger + "AEGIS" top bar visible; tap hamburger → drawer slides in from left with overlay; tap overlay or the `X` → closes; tap a nav link inside the drawer → navigates AND closes the drawer.
- At 390px: same as 768px, plus confirm `document.body` has no horizontal scrollbar on `/dashboard`, `/assess`, `/business/champion`, `/simulator/climber`.

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/AppShell.tsx
git commit -m "feat: mobile hamburger + drawer navigation for the app shell"
```

---

### Task 6: Landing hero preview card (compact score equation)

**Files:**
- Modify: `src/components/health-card/ScoreEquation.tsx` (add a `variant?: "full" | "compact"` prop)
- Modify: `src/app/page.tsx` (add the static Meher/Champion preview card to the hero, computed from the real engine)

**Interfaces:**
- Consumes: `assess()` and `SEEDS.champion.profile` (both already exported/pure) to compute real numbers for the static preview — never hardcode a score.
- Produces: `ScoreEquation` keeps its existing `{ a: CoreAssessment }` prop shape, adds an optional `variant` (default `"full"`, so every existing caller — `HealthCard.tsx`, and by extension `WhatIfPanel.tsx` — is unaffected).

- [ ] **Step 1: Add a `compact` variant to `ScoreEquation.tsx`**

Change the component signature (line 35) and cell rendering to support a smaller, footer-less rendering. Replace the file's export signature and `EquationCell` call site:

```tsx
export default function ScoreEquation({ a, variant = "full" }: { a: CoreAssessment; variant?: "full" | "compact" }) {
```

(keep everything else in the function body identical through the `cells` array construction), then replace the render return (previously lines 55-77) with:

```tsx
  // Mobile responsive rule: don't rely solely on horizontal scroll. Split into
  // two logical rows — (Capability − Penalties = Net) and, only when present,
  // (+ Evidence = Adjusted) — which stack on narrow viewports and sit inline
  // on wider ones. `overflow-x-auto` stays only as a per-row safety net for
  // very narrow phones, not as the primary mobile layout mechanism.
  const primaryCells = cells.slice(0, 3);   // cap, pen, net — always present
  const secondaryCells = cells.slice(3);    // evi, adj — only when showEvidence

  const renderRow = (row: Cell[]) => (
    <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
      {row.map(cell => (
        <div key={cell.key} className="flex items-stretch gap-2">
          {cell.op && (
            <div className="flex w-6 shrink-0 items-center justify-center text-xl font-medium text-[#9CA3AF]" aria-hidden>
              {cell.op}
            </div>
          )}
          <EquationCell cell={cell} compact={variant === "compact"} />
        </div>
      ))}
    </div>
  );

  return (
    <section className={variant === "compact" ? "" : "rounded-xl border border-[#E5E7EB] bg-white p-6"}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {renderRow(primaryCells)}
        {secondaryCells.length > 0 && renderRow(secondaryCells)}
      </div>

      {variant === "full" && (
        <div className="mt-4 flex items-start gap-2 border-t border-[#F1F3F2] pt-4">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
          <p className="text-xs leading-relaxed text-[#6B7280]">
            Core score is frozen. Operational evidence provides a bounded uplift (max +10). Hard policy flags override all scores.
          </p>
        </div>
      )}
    </section>
  );
```

And update `EquationCell` to accept and use the `compact` flag:

```tsx
function EquationCell({ cell, compact = false }: { cell: Cell; compact?: boolean }) {
  const t = TONE[cell.tone];
  const Icon = cell.icon;
  return (
    <div className={`flex ${compact ? "min-w-[100px] p-2.5" : "min-w-[168px] p-4"} flex-1 flex-col rounded-lg ${t.card}`}>
      <span className={`flex ${compact ? "h-7 w-7" : "h-9 w-9"} items-center justify-center rounded-lg`} style={{ backgroundColor: t.iconBg }}>
        <Icon className={compact ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"} strokeWidth={1.75} style={{ color: t.icon }} />
      </span>
      <p className={`mt-2 font-medium leading-tight ${compact ? "text-[11px]" : "text-xs"}`} style={{ color: t.label }}>
        {cell.label}
        {!compact && <span className="block font-normal opacity-80">({cell.sub})</span>}
      </p>
      <p className={`mt-1.5 font-semibold tabular-nums ${compact ? "text-xl" : "text-2xl"}`} style={{ color: t.value }}>
        {cell.value}
        {!compact && <span className="text-sm font-normal text-[#9CA3AF]"> / 100</span>}
      </p>
      {!compact && <p className="mt-1 text-[11px] leading-tight text-[#9CA3AF]">{cell.foot}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Add the hero preview card to `src/app/page.tsx`**

Add imports (top of file): `import { assess } from "@/engine/aegis-core"; import { SEEDS } from "@/data/seeds"; import { BUSINESS_PRESENTATION } from "@/data/presentation"; import { VERDICT_VISUAL } from "@/presentation/verdict"; import ScoreEquation from "@/components/health-card/ScoreEquation";` and add `Play` to the existing lucide-react import line (`import { Shield, LifeBuoy, ShieldAlert, TrendingUp, ArrowRight, Lock, Ban, Plus, MessageSquareText, Play } from "lucide-react";`).

Compute the preview at the top of the `Landing()` function body: `const heroAssessment = assess(SEEDS.champion.profile); const heroPres = BUSINESS_PRESENTATION.champion; const heroVerdict = VERDICT_VISUAL[heroAssessment.recommendation];`

Wrap the current hero `<section>` (lines 55-75) and the new preview card into a 2-column grid. Replace lines 55-75:

```tsx
        {/* hero */}
        <section className="fade-in grid gap-10 border-t border-[#E5E7EB] pt-16 pb-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1a4731]">Explainable credit-decision layer</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Credit decisions for the businesses a bureau score can&rsquo;t see.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#374151]">
              Aegis reads financial and alternative-data signals, produces a Financial Health Card with the evidence behind
              it, and advises the underwriter. It never auto-approves a loan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1a4731] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#166534]"
              >
                View Demo <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-5 py-3 text-sm font-semibold text-[#374151] transition-colors duration-150 hover:border-[#1a4731]"
              >
                <Play className="h-3.5 w-3.5" strokeWidth={2} fill="currentColor" /> How it works
              </a>
              <span className="inline-flex items-center gap-1.5 text-sm text-[#6B7280]">
                <Lock className="h-3.5 w-3.5" strokeWidth={1.75} /> Deterministic — no AI in scoring
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1a4731]">{SEEDS.champion.archetype}</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">{SEEDS.champion.businessName}</h2>
                <p className="text-sm text-[#6B7280]">{heroPres.industry} · {heroPres.location} · Established {heroPres.establishedYear}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: heroVerdict.color }}
                >
                  {heroAssessment.recommendation === "APPROVE" ? "APPROVED" : heroVerdict.label.toUpperCase()}
                </span>
                <p className="mt-1 text-xs text-[#6B7280]">{heroAssessment.decisionConfidence.band} Confidence</p>
              </div>
            </div>

            <div className="mt-4">
              <ScoreEquation a={heroAssessment} variant="compact" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-[#15803d]">Key Strengths</p>
                <ul className="mt-1.5 space-y-1">
                  {heroAssessment.decisionTrace.primaryDrivers.slice(0, 3).map(d => (
                    <li key={d} className="flex items-center gap-1.5 text-xs text-[#374151]">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#15803d]" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#ea580c]">Key Risks</p>
                <ul className="mt-1.5 space-y-1">
                  {heroAssessment.decisionTrace.riskDrivers.slice(0, 2).map(d => (
                    <li key={d} className="flex items-center gap-1.5 text-xs text-[#374151]">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ea580c]" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
```

Note: this reads `heroAssessment.decisionTrace.primaryDrivers`/`riskDrivers` — real engine output for the Champion seed (confirmed via `aegis-core.ts`'s `buildTrace`), not invented copy. The "Key Strengths"/"Key Risks" list length depends on how many drivers the engine actually returns for Champion; do not pad with placeholder text if there are fewer than 3/2.

- [ ] **Step 3: Give the "How it works" section an anchor target**

Elsewhere in `src/app/page.tsx` (unrelated to the hero replacement above), find the existing `<section className="border-t border-[#E5E7EB] py-14">` that contains the `"How it works"` label and the 4-item `ENGINE` map — this is the section the new hero ghost button scrolls to. Add `id="how-it-works"` to that `<section>` tag (nothing else in it changes): `<section id="how-it-works" className="border-t border-[#E5E7EB] py-14">`.

- [ ] **Step 4: Run build and tests**

Run: `npx tsc --noEmit` — expect no errors (verify `HealthCard.tsx`'s existing `<ScoreEquation a={a} />` call still compiles with the new optional prop).
Run: `npx vitest run` — expect the same 21 tests passing.
Run: `npm run build` — expect a clean build.

- [ ] **Step 5: Manual browser check**

`npm run dev`, visit `/`. Confirm the hero now shows a 2-column layout on desktop (text left, Health Card preview right) and stacks on mobile (< 1024px); the preview card's numbers match what `/business/champion` shows for Meher Components. Click "How it works" and confirm the page scrolls down to the "How it works" section.

- [ ] **Step 6: Commit**

```bash
git add src/components/health-card/ScoreEquation.tsx src/app/page.tsx
git commit -m "feat: add compact score-equation variant, landing hero preview card, and how-it-works anchor"
```

---

### Task 7: Landing "Data Ecosystem" section

**New content section, not in the earlier plan.** The landing page's job is to make Aegis's data story concrete: it doesn't invent new data, it stitches together signals already available across India's digital financial infrastructure. This task adds a static, purely-descriptive 8-card grid to `src/app/page.tsx`, between the existing "How it works" section and the closing CTA. No engine/data wiring — every card is hardcoded marketing copy, same spirit as the existing `MOAT`/`ENGINE` arrays already in this file.

**Files:**
- Modify: `src/app/page.tsx` (add one new section + a new `DATA_ECOSYSTEM` array, following the exact pattern of the existing `MOAT`/`ENGINE` consts)

**Interfaces:**
- Consumes: nothing — pure static content.
- Produces: nothing new exported; this is page-local content.

- [ ] **Step 1: Add the `DATA_ECOSYSTEM` array**

Add this near the top of the file, alongside the existing `MOAT`/`ENGINE` consts, importing the additional icons used (`Landmark`, `Receipt`, `Droplets`, `FileSpreadsheet`, `Users`, `CreditCard`, `Building2`, `Smartphone` — add these to the existing lucide-react import line):

```ts
const DATA_ECOSYSTEM = [
  { icon: Landmark, source: "Account Aggregator", purpose: "Consented financial information", signals: ["Cash-flow trends", "Banking behaviour", "Balance consistency", "Financial stability"], tag: "Consent-based" },
  { icon: Receipt, source: "GSTN", purpose: "Business tax filing behaviour", signals: ["GST filing consistency", "Filing gaps", "Payment regularity", "Compliance history"], tag: "Government verified" },
  { icon: Droplets, source: "BBPS", purpose: "Utility payment behaviour", signals: ["Electricity payments", "Utility consistency", "Payment discipline"], tag: "Verified payment records" },
  { icon: FileSpreadsheet, source: "TReDS", purpose: "Invoice financing participation", signals: ["Invoice discounting", "Working capital usage", "Receivable behaviour"], tag: "Trade ecosystem" },
  { icon: Users, source: "EPFO / ESIC", purpose: "Employment and workforce stability", signals: ["Workforce continuity", "Contribution consistency", "Operational stability"], tag: "Operational evidence" },
  { icon: CreditCard, source: "Credit Bureau", purpose: "Traditional credit history", signals: ["Bureau score", "Existing defaults", "Delinquencies", "Credit history"], tag: "Traditional credit signal" },
  { icon: Building2, source: "MCA / UDYAM", purpose: "Business identity verification", signals: ["Entity existence", "Registration status", "Business age"], tag: "Identity verification" },
  { icon: Smartphone, source: "Digital Payments", purpose: "Business digital adoption", signals: ["Digital receipts", "Payment behaviour", "Transaction consistency"], tag: "Operational behaviour" },
] as const;
```

- [ ] **Step 2: Add the section, between "How it works" and the closing CTA**

Find the closing-CTA `<section>` (the one with `"See it decide on eight real archetypes."`). Immediately before it, insert:

```tsx
        {/* the data ecosystem */}
        <section className="border-t border-[#E5E7EB] py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">The data ecosystem</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Built on India&rsquo;s digital financial infrastructure.</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">
              Aegis doesn&rsquo;t replace existing lending systems. It brings together verified financial, operational, and
              ecosystem signals already available across India&rsquo;s digital infrastructure into one explainable Financial
              Health Card.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DATA_ECOSYSTEM.map(d => {
              const Icon = d.icon;
              return (
                <div key={d.source} className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0fdf4]">
                    <Icon className="h-[18px] w-[18px] text-[#1a4731]" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-[#111827]">{d.source}</h3>
                  <p className="mt-1 text-xs text-[#6B7280]">{d.purpose}</p>
                  <ul className="mt-3 space-y-1">
                    {d.signals.map(s => (
                      <li key={s} className="text-xs leading-relaxed text-[#6B7280]">· {s}</li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-block w-fit rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
                    {d.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
```

- [ ] **Step 3: Run build and tests**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npx vitest run` — expect the same 21 tests passing.
Run: `npm run build` — expect a clean build.

- [ ] **Step 4: Manual browser check**

`npm run dev`, visit `/`. Confirm the new "Built on India's digital financial infrastructure" section renders between "How it works" and the closing CTA, with all 8 cards. At ≥1024px confirm a 4-column grid; at 640–1024px confirm 2 columns; below 640px confirm 1 column. No horizontal scroll at 390px.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add landing page data-ecosystem section (8 ecosystem data sources)"
```

---

### Task 8: Dashboard 2-column grid at ≥1024px

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx:32` (the business list container)

**Interfaces:**
- Consumes/produces: nothing — pure layout change, same data (`businesses` from `listBusinessSummaries()`).

- [ ] **Step 1: Change the list container to a responsive grid**

Replace line 32: `<ul className="mt-6 space-y-3">` with `<ul className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">`.

Each `<li>` currently renders a `<Link>` with `sm:flex-row` — at the new 2-column breakpoint (1024px) cards are narrower than before, so change the card's internal layout breakpoint from `sm:flex-row` to `xl:flex-row` (so within a ~500px-wide grid cell the "Evaluate →" arrow doesn't get squeezed) — update line 42: `className="flex flex-col gap-4 rounded-xl border border-[#1a4731]... p-5 shadow-sm transition-colors duration-150 hover:border-[#1a4731] xl:flex-row xl:items-start xl:justify-between"` (keep the existing hover-border color from Task 2's edit; only `sm:flex-row` → `xl:flex-row` changes here).

- [ ] **Step 2: Run build and tests**

Run: `npx vitest run` — expect the same 21 tests passing (no logic touched).
Run: `npm run build` — expect a clean build.

- [ ] **Step 3: Manual browser check**

`npm run dev`, visit `/dashboard` in DevTools responsive mode: at ≥1024px width confirm a 2-column card grid; below 1024px confirm a single column; confirm no horizontal scroll at 390px.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "feat: 2-column application grid on the dashboard at desktop widths"
```

---

### Task 9: Transparency Panel — add the Data Provenance section

**Follow-up to the already-merged Task 4.** After Task 4 shipped, the user asked for a fourth section — **Data Provenance** — prepended before the existing three (Raw Input Profile, Engine Outputs, Narrator). It is pure static/presentational content: a hardcoded table naming which ecosystem data sources fed this assessment and whether each was available, framing the demo's "built on India's digital financial infrastructure" narrative. It does **not** read from `_debug` or any engine field — it's editorial chrome, same spirit as `src/data/presentation.ts`'s `DEMO_INSIGHT` map (real content, but not derived from or scored by the engine).

**Files:**
- Modify: `src/components/TransparencyPanel.tsx` (add one new section, renumber the existing three from 1/2/3 to 2/3/4 in the UI copy only — no prop/type changes)

**Interfaces:**
- Consumes: nothing new — this section renders a hardcoded array, not a prop.
- Produces: no signature change. `TransparencyPanel({ debug }: { debug: AssessDebug })` is unchanged; `ProfileForm.tsx` needs no edits for this task.

- [ ] **Step 1: Add the hardcoded provenance data and render it as the first section**

Add this above the `TransparencyPanel` component, alongside the file's other module-level consts:

```ts
const DATA_PROVENANCE: ReadonlyArray<{ source: string; available: boolean; signals: string }> = [
  { source: "Credit Bureau", available: true, signals: "Bureau score" },
  { source: "GSTN", available: true, signals: "Filing consistency" },
  { source: "Account Aggregator", available: true, signals: "Cash-flow stability" },
  { source: "BBPS", available: true, signals: "Utility payments" },
  { source: "EPFO", available: false, signals: "Workforce stability" },
  { source: "TReDS", available: true, signals: "Invoice financing" },
];
```

Insert this as the first child inside the `{open && (<div className="divide-y ...">` block (i.e. immediately before the existing "Raw Input Profile" `<div className="p-6">`):

```tsx
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Data Provenance</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              This assessment combines signals from verified ecosystem participants. Each signal contributes only where available.
            </p>
            <table className="mt-3 w-full border-collapse text-xs">
              <thead>
                <tr className="text-left text-[#9CA3AF]">
                  <th className="px-3 py-1.5 font-medium">Source</th>
                  <th className="px-3 py-1.5 font-medium">Status</th>
                  <th className="px-3 py-1.5 font-medium">Signals Used</th>
                </tr>
              </thead>
              <tbody>
                {DATA_PROVENANCE.map((row, i) => (
                  <tr key={row.source} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                    <td className={`px-3 py-1.5 ${row.available ? "text-[#111827]" : "text-[#9CA3AF]"}`}>{row.source}</td>
                    <td className={`px-3 py-1.5 ${row.available ? "text-[#15803d]" : "text-[#9CA3AF]"}`}>{row.available ? "Available" : "Not Available"}</td>
                    <td className={`px-3 py-1.5 ${row.available ? "text-[#111827]" : "text-[#9CA3AF]"}`}>{row.signals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs italic text-[#9CA3AF]">Unavailable sources are ignored. They never create negative scores.</p>
          </div>
```

- [ ] **Step 2: Renumber the existing three sections' copy (UI text only)**

The existing "Raw Input Profile", "Engine Outputs", and "Narrator" sections keep their exact code — only update the mental/visual ordering by leaving them immediately after the new Data Provenance block you just inserted (no code change needed there beyond insertion order, since none of the existing three sections hardcode a number like "1."/"2." in their copy — confirm this by checking `TransparencyPanel.tsx`'s current text; if you find a hardcoded step number anywhere, update it to match the new 1-2-3-4 order).

- [ ] **Step 3: Run build and tests**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npx vitest run` — expect the same 21 tests passing (this task touches no test-covered logic).
Run: `npm run build` — expect a clean build.

- [ ] **Step 4: Manual browser check**

`npm run dev`, visit `/assess`, submit the default example. Confirm the "Engine Computation Log" accordion now shows 4 sections in order: Data Provenance (first), Raw Input Profile, Engine Outputs, Narrator. Confirm the Data Provenance table shows 6 rows with EPFO greyed out as "Not Available" and the other 5 as "Available" in green.

- [ ] **Step 5: Commit**

```bash
git add src/components/TransparencyPanel.tsx
git commit -m "feat: add Data Provenance section to the Transparency Panel"
```

---

### Task 10: Assess wizard — convert `ProfileForm` to a 5-step stepper

**Files:**
- Modify: `src/components/assess/ProfileForm.tsx` (restructure into a stepper; same 13+4 fields, same `toRaw()`/`validateProfile()`/submit-to-`/api/assess` logic, same `TransparencyPanel` wiring from Task 4)

**Interfaces:**
- Consumes: everything already imported by `ProfileForm.tsx` today, plus `Check`, `ChevronLeft`, `ChevronRight` icons from `lucide-react`, plus `PROFILE_FIELD_ORDER` from `@/constants/profileFields` (created in Task 4 — the Review step reuses this exact constant instead of `Object.keys(form)`, so its row order matches the Transparency Panel's raw-input table order).
- Produces: same `export default function ProfileForm()` signature — `src/app/(app)/assess/page.tsx` is untouched.

**Step re-grouping — engine fields, unchanged from the earlier plan:**

1. **Business** — `yearsOperating`, `cashflowTrend`, `seasonality`, **plus 5 decorative-only fields** (business name, annual turnover, industry, GSTIN, city — see Step 0 below)
2. **Financial** — `gstOnTimeRate`, `gstMaxGapCycles`, `gstLastCycleLate`, `digitalReceiptsShare`, `digitalHistoryMonths`, `avgReceivableDays`, `topVendorShare`
3. **Risk Flags** — `seasonalCashDip`, `activeDefault`, `kycMismatch`
4. **Operational Evidence** — `electricityTrend`, `workforceTrend`, `utilityPayment`, `tredsHistory`
5. **Review** — summary table of the real 17 `MSMEProfile` fields (via `PROFILE_FIELD_ORDER`, unchanged) + a separate, clearly-labeled "display only" block for the 5 decorative fields + submit

**On the 5 decorative fields (business name / annual turnover / industry / GSTIN / city):** these do not exist in `MSMEProfile` and have zero effect on the assessment. The user has explicitly asked for them back as narrative chrome — each rendered with a muted "source hint" line (e.g. "From MCA / UDYAM registration") showing where such data would normally come from in a real deployment. They live in their own local `useState`, are never read by `toRaw()`, never validated by `validateProfile()`, and never appear in `PROFILE_FIELD_ORDER` or the Transparency Panel — keep this boundary exact so nobody mistakes them for scored inputs.

- [ ] **Step 0: Add the decorative-only business-identity fields**

These are display chrome, not engine inputs — keep them entirely separate from `FormState`/`toRaw()`/`validateProfile()`.

Add above `export default function ProfileForm()`, alongside the other field-metadata consts:

```ts
type BusinessIdentity = {
  businessName: string;
  annualTurnover: string;
  industry: string;
  gstin: string;
  city: string;
};

const BUSINESS_IDENTITY_FIELDS: ReadonlyArray<{
  key: keyof BusinessIdentity;
  label: string;
  hint: string;
}> = [
  { key: "businessName", label: "Business name", hint: "From MCA / UDYAM registration" },
  { key: "annualTurnover", label: "Annual turnover (₹)", hint: "Typically from Account Aggregator or GST returns" },
  { key: "industry", label: "Industry", hint: "From business registration" },
  { key: "gstin", label: "GSTIN", hint: "From GSTN" },
  { key: "city", label: "City", hint: "From business registration" },
];

const EMPTY_BUSINESS_IDENTITY: BusinessIdentity = {
  businessName: "", annualTurnover: "", industry: "", gstin: "", city: "",
};
```

Inside `ProfileForm()`, add the state (near the other `useState` calls, around line 193): `const [identity, setIdentity] = useState<BusinessIdentity>(EMPTY_BUSINESS_IDENTITY);`

Add a setter alongside the existing `set()` helper: `const setIdentity_ = <K extends keyof BusinessIdentity>(key: K, value: string) => setIdentity((prev) => ({ ...prev, [key]: value }));` (name it whatever reads cleanly next to the existing `set` — the point is it only ever touches `identity` state, never `form`).

- [ ] **Step 1: Add step state and navigation to `ProfileForm.tsx`**

Add near the top of `ProfileForm()` (after existing `useState` calls around line 193): `const [step, setStep] = useState(0);` and a step metadata array right above the `NUMBER_FIELDS` const block or inline in the component:

```ts
const STEPS = ["Business", "Financial", "Risk Flags", "Operational Evidence", "Review"] as const;
```

- [ ] **Step 2: Add a stepper header component in the same file**

Add this function above `export default function ProfileForm()`:

```tsx
function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  state === "done" ? "bg-[#15803d] text-white"
                  : state === "active" ? "bg-[#1a4731] text-white"
                  : "border border-[#D1D5DB] text-[#9CA3AF]"
                }`}
              >
                {state === "done" ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:inline ${state === "upcoming" ? "text-[#9CA3AF]" : "font-semibold text-[#111827]"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-3 h-0.5 flex-1 ${i < current ? "bg-[#15803d]" : "bg-[#E5E7EB]"}`} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

Add the `Check` import to the existing lucide-react import line (line 4): `import { Building2, Info, Check, ChevronLeft, ChevronRight } from "lucide-react";`

Add the shared field-order import (near line 9, alongside the other `@/` imports): `import { PROFILE_FIELD_ORDER } from "@/constants/profileFields";`

- [ ] **Step 3: Restructure the form body into stepped sections**

The existing 4 `<section>` blocks (Business info / Financial signals / Risk flags / Operational evidence, lines 271-417) already match the 13+4 field grouping almost exactly — Task 10 only needs to (a) show one section at a time based on `step`, (b) add a 5th Review section, (c) add Back/Next navigation, (d) validate only the current step's fields before advancing (full `validateProfile()` stays the sole authority at final submit — this just gates step-to-step navigation with the same validator, never a separate partial schema), and (e) add the decorative business-identity fields from Step 0 into Step 1 and the Review step.

Add this just above the `return` statement, inside `ProfileForm()`:

```ts
  const FIELDS_BY_STEP: readonly string[][] = [
    ["cashflowTrend", "seasonality", "yearsOperating"],
    ["gstLastCycleLate", ...FINANCIAL_NUMBER_KEYS],
    [...RISK_FLAG_BOOL_KEYS],
    ["electricityTrend", "workforceTrend", "utilityPayment", "tredsHistory"],
  ];

  // Validate with the SAME validateProfile() used at final submit, but only
  // surface and gate on errors belonging to the step the user is currently
  // on — fields on unvisited later steps still hold their (valid) defaults,
  // so this never blocks on a field the user hasn't reached yet.
  function goNext() {
    const validation = validateProfile(toRaw(form));
    const stepFields = FIELDS_BY_STEP[step] ?? [];
    const stepErrors: Record<string, string> = {};
    if (!validation.ok) {
      for (const key of stepFields) {
        if (validation.errors[key]) stepErrors[key] = validation.errors[key];
      }
    }
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of stepFields) delete next[key];
      return { ...next, ...stepErrors };
    });
    if (Object.keys(stepErrors).length === 0) {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }
  }
```

Wrap the `<form>` return (replacing lines 249-447) with:

```tsx
  return (
    <div className="space-y-6">
      <Stepper current={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Load example — shown only on step 0, same as before */}
          {step === 0 && (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Start from a known case</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => { loadExample(b.profile); setStep(0); }}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm text-[#374151] transition-colors duration-150 hover:border-[#1a4731] hover:text-[#111827]"
                  >
                    <Building2 className="h-4 w-4 text-[#6B7280]" strokeWidth={1.75} />
                    {b.businessName}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#9CA3AF]">Loads the archetype&apos;s inputs so you can tweak from there.</p>
            </section>
          )}

          {/* Step 1: Business */}
          {step === 0 && (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <SectionHeader title="Business info" hint="What kind of business this is and how it has been trending." />
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="cashflowTrend" text="Cash-flow trend" unit="enum" fieldKey="cashflowTrend" />
                  <select id="cashflowTrend" value={form.cashflowTrend} onChange={(e) => set("cashflowTrend", e.target.value)} className={`${inputBase} ${errBorder("cashflowTrend")}`}>
                    {CASHFLOW_OPTIONS.map((o) => <option key={o} value={o}>{cap(o)}</option>)}
                  </select>
                  {errors.cashflowTrend && <p className="mt-1 text-xs text-[#dc2626]">{errors.cashflowTrend}</p>}
                </div>
                <div>
                  <FieldLabel htmlFor="seasonality" text="Seasonality" unit="enum" fieldKey="seasonality" />
                  <select id="seasonality" value={form.seasonality} onChange={(e) => set("seasonality", e.target.value)} className={`${inputBase} ${errBorder("seasonality")}`}>
                    {SEASONALITY_OPTIONS.map((o) => <option key={o} value={o}>{cap(o)}</option>)}
                  </select>
                  {errors.seasonality && <p className="mt-1 text-xs text-[#dc2626]">{errors.seasonality}</p>}
                </div>
                {businessInfoFields.map((fld) => (
                  <div key={fld.key}>
                    <FieldLabel htmlFor={fld.key} text={fld.label} unit={fld.unit} fieldKey={fld.key} />
                    <input id={fld.key} name={fld.key} type="number" inputMode="decimal" step={fld.step} value={form[fld.key]} onChange={(e) => set(fld.key, e.target.value)} aria-invalid={errors[fld.key] ? true : undefined} className={`${inputBase} ${errBorder(fld.key)}`} />
                    {errors[fld.key] && <p className="mt-1 text-xs text-[#dc2626]">{errors[fld.key]}</p>}
                  </div>
                ))}
              </div>

              {/* Decorative-only — display chrome, never submitted or validated */}
              <div className="mt-6 border-t border-[#E5E7EB] pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Business identity <span className="normal-case font-normal">(display only — not scored)</span></p>
                <div className="mt-3 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  {BUSINESS_IDENTITY_FIELDS.map((fld) => (
                    <div key={fld.key}>
                      <label htmlFor={`identity-${fld.key}`} className="block text-sm font-medium text-[#111827]">{fld.label}</label>
                      <input
                        id={`identity-${fld.key}`}
                        type="text"
                        value={identity[fld.key]}
                        onChange={(e) => setIdentity_(fld.key, e.target.value)}
                        className={inputBase}
                      />
                      <p className="mt-1 text-xs text-[#9CA3AF]">{fld.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Financial */}
          {step === 1 && (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <SectionHeader title="Financial signals" hint="GST compliance, digital adoption, and payment behaviour." />
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                {financialFields.map((fld) => (
                  <div key={fld.key}>
                    <FieldLabel htmlFor={fld.key} text={fld.label} unit={fld.unit} fieldKey={fld.key} />
                    <input id={fld.key} name={fld.key} type="number" inputMode="decimal" step={fld.step} value={form[fld.key]} onChange={(e) => set(fld.key, e.target.value)} aria-invalid={errors[fld.key] ? true : undefined} className={`${inputBase} ${errBorder(fld.key)}`} />
                    {errors[fld.key] && <p className="mt-1 text-xs text-[#dc2626]">{errors[fld.key]}</p>}
                  </div>
                ))}
              </div>
              <label className="mt-5 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-md border border-[#E5E7EB] p-3 transition-colors duration-150 hover:border-[#D1D5DB]">
                <input type="checkbox" checked={form.gstLastCycleLate} onChange={(e) => set("gstLastCycleLate", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1a4731]" />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-[#111827]">
                    {gstLastCycleLateField.label}
                    <FieldHint text={FIELD_HELP.gstLastCycleLate} />
                  </span>
                  <span className="block text-xs text-[#6B7280]">{gstLastCycleLateField.hint}</span>
                </span>
              </label>
            </section>
          )}

          {/* Step 3: Risk Flags */}
          {step === 2 && (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <SectionHeader title="Risk flags" hint="Active default and KYC mismatch are hard flags — they override the score outright." />
              <div className="grid gap-3 sm:grid-cols-2">
                {riskFlagFields.map((fld) => (
                  <label key={fld.key} className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-md border border-[#E5E7EB] p-3 transition-colors duration-150 hover:border-[#D1D5DB]">
                    <input type="checkbox" checked={form[fld.key]} onChange={(e) => set(fld.key, e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1a4731]" />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[#111827]">
                        {fld.label}
                        <FieldHint text={FIELD_HELP[fld.key]} />
                      </span>
                      <span className="block text-xs text-[#6B7280]">{fld.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Step 4: Operational Evidence */}
          {step === 3 && (
            <section className="rounded-xl border border-[#1a473140] bg-[#f0fdf4] p-6 shadow-sm">
              <SectionHeader title="Operational evidence" hint="Optional. Each verified signal provides bounded uplift (max +10 total). Does not override hard flags." />
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                {ALT_FIELDS.map((fld) => {
                  const err = errors[fld.key];
                  return (
                    <div key={fld.key}>
                      <label htmlFor={fld.key} className="block text-sm font-medium text-[#111827]">
                        {fld.label} <span className="font-normal text-[#9CA3AF]">· optional</span>
                      </label>
                      <select id={fld.key} value={form[fld.key]} onChange={(e) => set(fld.key, e.target.value)} className={`${inputBase} ${errBorder(fld.key)}`}>
                        <option value="">Not available</option>
                        {fld.options.map((o) => <option key={o} value={o}>{altLabel(o)}</option>)}
                      </select>
                      <p className="mt-1 text-xs text-[#9CA3AF]">{fld.hint}</p>
                      {err && <p className="mt-1 text-xs text-[#dc2626]">{err}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Step 5: Review */}
          {step === 4 && (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <SectionHeader title="Review" hint="Zod validates on submit — fix any highlighted fields if they appear." />

              <p className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Business identity <span className="normal-case font-normal">(display only — not submitted)</span></p>
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  {BUSINESS_IDENTITY_FIELDS.map((fld, i) => (
                    <tr key={fld.key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                      <td className="px-3 py-1.5 text-[#6B7280]">{fld.label}</td>
                      <td className="px-3 py-1.5 text-[#111827]">{identity[fld.key] || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Signals submitted to the engine</p>
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  {PROFILE_FIELD_ORDER.map((key, i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-[#f9fafb]" : ""}>
                      <td className="px-3 py-1.5 text-[#6B7280]">{key}</td>
                      <td className="px-3 py-1.5 text-[#111827]">{String(form[key] === "" ? "Not available" : form[key])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {formError && (
            <p className="rounded-md border border-[#dc262640] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{formError}</p>
          )}

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[#6B7280] ${step === 0 ? "invisible" : ""}`}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#1a4731] px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#166534]"
              >
                Next: {STEPS[step + 1]} <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-[#1a4731] px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#166534] disabled:cursor-default disabled:opacity-60"
              >
                {submitting ? "Assessing…" : "Assess with Aegis"}
              </button>
            )}
          </div>
          {Object.keys(errors).length > 0 && (
            <p className="text-sm text-[#dc2626]">Fix the highlighted fields to continue.</p>
          )}
          <p className="text-center text-xs text-[#9CA3AF]">All inputs are validated at the boundary. Nothing is scored until you submit.</p>
        </form>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-sm font-medium text-[#111827]">About this assessment</p>
            <ul className="mt-3 space-y-2">
              {["13 signals", "Deterministic scoring", "No AI in scoring", "Advises the underwriter"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-[#374151]">
                  <Check className="h-4 w-4 shrink-0 text-[#15803d]" strokeWidth={2} />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {result && (
        <section className="space-y-4">
          <div className="mb-4 border-t border-[#E5E7EB] pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#1a4731]">Live engine result</p>
          </div>
          <HealthCard a={result} />
          {debug && <TransparencyPanel debug={debug} />}
        </section>
      )}
    </div>
  );
```

Notes: on validation failure at final submit, `onSubmit` (unchanged from Task 4) still calls `setErrors(validation.errors)` without changing `step` — if an error lands on a field from an earlier step, jump back to it, reusing the same `FIELDS_BY_STEP` table `goNext` uses (no second hand-rolled step→fields mapping): add this right after the existing `setErrors(validation.errors);` line inside `if (!validation.ok) { ... }`, before the early `return`:

```ts
      const firstErrorKey = Object.keys(validation.errors)[0];
      const stepOfField = (k: string): number => {
        const idx = FIELDS_BY_STEP.findIndex((fields) => fields.includes(k));
        return idx === -1 ? STEPS.length - 1 : idx; // unmatched key → Review (last step)
      };
      if (firstErrorKey) setStep(stepOfField(firstErrorKey));
```

- [ ] **Step 4: Run build and tests**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npx vitest run` — expect the same 21 tests passing (this component has no unit tests; the engine/schema tests are unaffected since `toRaw()`/`validateProfile()`/the POST body are unchanged).
Run: `npm run build` — expect a clean build.

- [ ] **Step 5: Manual browser check — full wizard walkthrough**

`npm run dev`, visit `/assess`.
- Confirm the stepper shows 5 steps, step 1 active.
- Click "Load example" (Meher Components) on step 1 — confirm fields populate and step stays at 1.
- Click "Next" through all 5 steps, confirm the stepper advances and "Back" returns correctly at each step.
- On step 2 (Financial), clear the "GST on-time rate" field to blank and click "Next" — confirm the wizard does NOT advance to step 3, shows the field's inline error, and the field's error clears once you fix the value and click "Next" again.
- On step 1, fill in the 5 decorative business-identity fields (Business name, Annual turnover, Industry, GSTIN, City) — confirm each shows its muted source-hint line below the label.
- On step 5 (Review), confirm the summary shows two separate tables: "Business identity (display only)" with the 5 decorative values entered on step 1, then "Signals submitted to the engine" with all 17 real fields in the same order as the Transparency Panel's "Raw Input Profile" table (both now read `PROFILE_FIELD_ORDER`).
- Submit — confirm the Health Card renders with the "Live engine result" label and the Engine Computation Log accordion appears below it (from Task 4). Open the accordion's "Raw Input Profile" section and confirm none of the 5 decorative fields (business name, turnover, industry, GSTIN, city) appear anywhere in it — only the real 17 `MSMEProfile` fields.
- Go back to step 1, clear a required field (e.g. blank `gstOnTimeRate` on step 2) and submit from step 5 — confirm the wizard jumps back to step 2 with the field's error message shown, engine is NOT called (no new result renders).

- [ ] **Step 6: Commit**

```bash
git add src/components/assess/ProfileForm.tsx
git commit -m "feat: convert the assess form into a 5-step wizard with decorative business-identity fields"
```

---

### Task 11: Final full-repo verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: `Test Files 4 passed (4)`, `Tests 21 passed (21)` (17 original + 2 in `narrator.test.ts` + 2 in `assessmentAdapter.test.ts` from Task 3).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: clean build, zero type errors, zero lint errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Simulator regression check (Nila 48→61)**

`npm run dev`, visit `/simulator/climber`. Move the "Receivable days" slider down to 40 (leave GST/vendor untouched). Confirm: net score moves from 48 to 61 and the recommendation flips from "Not yet — clear path to yes" to "Approve", matching `aegis-core.test.ts`'s existing assertion. Confirm the Health Card re-rendered inline uses the new color tokens (green `#15803d` on the now-APPROVE state).

- [ ] **Step 4: `/api/assess` contract checks (dev and production)**

Repeat the two `curl` checks from Task 3 Step 12 against `npm run dev` (invalid input → 400 + per-field errors, no `_debug`; valid Meher-shaped input → `_debug.rawProfile`/`engineOutputs`/`narratorPrompt` all present, since `next dev` sets `NODE_ENV=development`).

Then confirm the dev-only gate actually holds in a production build: `npm run build && npm start` (defaults to port 3000; stop the dev server first), repeat the valid-Meher-profile `curl` call, and confirm the response is `{ "ok": true, "assessment": { ... } }` with **no `_debug` key at all** — not `_debug: null`, absent entirely. Stop the production server afterward.

- [ ] **Step 5: Cross-page visual/regression sweep**

At 1280px, 768px, and 390px widths, visit `/`, `/dashboard`, `/business/champion`, `/business/mirage` (hard-flagged — confirm Policy Flags panel is red `#dc2626`/`#fef2f2` and Recommendation banner matches), `/assess` (walk the wizard once more), `/simulator/climber`. Confirm at each width: no horizontal scroll, mobile drawer works below 1024px, no emoji anywhere, dashboard is 2-column at ≥1024px and 1-column below. On `/business/evidence` at 390px specifically, confirm the Score Equation (which has all 5 cells for this seed) stacks into two rows — `Capability − Penalties = Net` then `+ Evidence = Adjusted` — rather than needing horizontal scroll to see the Adjusted Net cell.

- [ ] **Step 6: Landing "Data Ecosystem" section check**

On `/`, confirm the "Built on India's digital financial infrastructure" section (Task 7) renders between "How it works" and the closing CTA with all 8 cards, and that clicking the hero's "How it works" ghost button scrolls to the "How it works" section (Task 6's anchor).

- [ ] **Step 7: Transparency Panel "Data Provenance" check**

On `/assess`, submit a profile, open the Engine Computation Log, confirm 4 sections appear in order (Data Provenance, Raw Input Profile, Engine Outputs, Narrator) and the Data Provenance table shows EPFO as "Not Available" (grey) and the other 5 sources as "Available" (green).

- [ ] **Step 8: Wizard decorative-fields boundary check**

On `/assess`, fill in the 5 decorative business-identity fields (business name, turnover, industry, GSTIN, city) on step 1, complete the wizard, and submit. Confirm: the Review step (step 5) shows them in a separate "display only" table; the submitted `/api/assess` request body (check via DevTools Network tab) does NOT include any of the 5 decorative field names; the Transparency Panel's Raw Input Profile table does NOT show them either — only the 17 real `MSMEProfile`/`PROFILE_FIELD_ORDER` fields.

- [ ] **Step 9: Report**

Summarize pass/fail for each of the checks above and list every file touched across Tasks 1–10 (git diff/status).

- [ ] **Step 10: Final commit (if anything was left uncommitted)**

```bash
git status
```
If clean (all prior task commits already cover everything), nothing further to do. Otherwise stage and commit any remainder with a descriptive message.
