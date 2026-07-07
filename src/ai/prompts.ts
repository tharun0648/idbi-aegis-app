import type { CoreAssessment } from "@/engine/aegis-core";
import type { BusinessMeta } from "@/engine/assessmentAdapter";

/**
 * NARRATOR PROMPTS — the moat, enforced in words.
 * ------------------------------------------------------------------
 * The engine (aegis-core.ts) has ALREADY decided. These prompts constrain the
 * LLM to a single job: phrase that finished decision. The system prompt forbids
 * inventing/altering any number, upgrading/softening the recommendation, and
 * adding advice not in the data. The user prompt hands over ONLY engine output,
 * and — critically — a pre-computed DECISION SCORE so the model never has to
 * choose between netScore and adjustedNetScore (CLAUDE.md score rule):
 *   - no hard flag  → decision score = adjustedNetScore
 *   - hard flag     → Refer/Decline; the score is irrelevant and must not be
 *                     presented as offsetting the breach.
 */

export const SYSTEM_PROMPT = `You are the underwriting narrator for Aegis, an explainable credit-decision system for MSME (small-business) lending. Aegis has ALREADY made the decision using a separate, deterministic engine. Your ONLY job is to phrase that finished decision into a short, plain-English summary for a human underwriter. You advise; you do not decide.

ABSOLUTE RULES — you are a phraser, not a decision-maker:
- Use ONLY the facts given below. Never invent, compute, estimate, round, or change any number. Every figure you mention must appear verbatim in the input.
- Never upgrade, soften, downgrade, or hedge the recommendation. State the decision exactly as provided.
- Do not add factors, conditions, guarantees, advice, or next steps that are not in the input.
- Cite only the single DECISION SCORE provided. Never cite any other score, and never present a raw or unadjusted figure.

WHEN A POLICY VIOLATION IS PRESENT (a breach is listed):
- The decision is Refer / Decline. Name the specific breach. Do NOT imply approval, creditworthiness, potential, or any path to a yes. Strong operating numbers do NOT offset a policy breach — do not present the score, strengths, or evidence as if they help the case.

WHEN THERE IS NO POLICY VIOLATION:
- Reflect the recommendation and cite the decision score provided.
- If a positive amount of verified operational evidence is listed, you may note that this independently verified operational evidence lifted an otherwise borderline decision — using only the named signals and the amount given, no invented specifics.

STYLE:
- 2 to 3 sentences. About 55 words. Never exceed 3 sentences.
- Plain, professional underwriter English. No markdown, no bullet points, no headings, no emoji.
- Do not use internal field names, code identifiers, JSON, or the word "score" formatted as data. Write for a person.
- Neutral, factual, decisive.

Output only the summary prose. Nothing before or after it.`;

const REC_PHRASE: Record<CoreAssessment["recommendation"], string> = {
  APPROVE: "Approve",
  CONDITIONAL: "Approve with conditions",
  DECLINE_WITH_PATH: "Not yet approvable, with a defined improvement path",
  REFER_OR_DECLINE: "Refer / Decline",
};

/**
 * Build the user message: ONLY engine output, human-labelled. The decision score
 * is resolved here (deterministically) so the model cannot pick the wrong one.
 */
export function buildUserPrompt(core: CoreAssessment, business: BusinessMeta): string {
  const flagged = core.hardFlags.length > 0;
  const decisionScore = flagged ? core.netScore : core.adjustedNetScore;

  const lines: string[] = [
    `Business: ${business.businessName} (${business.archetype}).`,
    `Recommendation: ${REC_PHRASE[core.recommendation]}.`,
    `Decision score to cite: ${decisionScore} out of 100.`,
    `Decision confidence: ${core.decisionConfidence.band} (${core.decisionConfidence.score}). Basis: ${core.decisionConfidence.reason}`,
    `Reason for the call: ${core.decisionTrace.decisionReason}`,
  ];

  if (flagged) {
    const breaches = core.hardFlags.map(f => `${f.label} — ${f.basis.replace(/\.$/, "")}`).join("; ");
    lines.push(`POLICY VIOLATION present (this overrides everything): ${breaches}.`);
    lines.push(`Do not mention the score, strengths, or any evidence as offsetting this breach.`);
  } else {
    if (core.decisionTrace.primaryDrivers.length > 0) {
      lines.push(`Main strengths: ${core.decisionTrace.primaryDrivers.join(", ")}.`);
    }
    if (core.decisionTrace.riskDrivers.length > 0) {
      lines.push(`Open risks: ${core.decisionTrace.riskDrivers.join(", ")}.`);
    }
    if (core.alternativeEvidenceScore > 0) {
      const signals = core.altEvidence.breakdown
        .filter(r => r.contribution > 0)
        .map(r => `${r.signal.toLowerCase()} (${r.value.toLowerCase()})`)
        .join(", ");
      lines.push(
        `Verified operational evidence added ${core.alternativeEvidenceScore} point(s) to a borderline case, lifting the decision score to ${decisionScore}: ${signals}. You may credit this evidence for carrying the decision.`,
      );
    }
  }

  return lines.join("\n");
}
