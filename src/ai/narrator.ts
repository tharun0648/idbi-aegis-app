import type { CoreAssessment } from "@/engine/aegis-core";
import type { BusinessMeta } from "@/engine/assessmentAdapter";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/ai/prompts";

/**
 * LLM NARRATOR — the ONLY LLM-authored step, server-side only.
 * ------------------------------------------------------------------
 * Phrases the engine's already-decided output into prose (businessNarrative).
 * It NEVER computes or alters a number and NEVER changes a decision — the moat
 * is enforced by the prompts and by handing the model a pre-resolved decision
 * score (see prompts.ts). Deterministic engine output stays sacred.
 *
 * DEMO-SAFE by construction — strictly additive:
 *   - No GROQ_API_KEY, any error, or a >10s timeout → returns null and the page
 *     renders exactly as it does today (no narrative block, no crash).
 *   - The OpenAI SDK is lazy-imported so it never loads on the no-key path and
 *     never reaches the client bundle.
 *   - Successful narratives are cached per stable business id; failures are not.
 *
 * PROVIDER: Groq via the OpenAI-compatible endpoint. Model gpt-oss-120b (GA),
 * with a one-shot fallback to gpt-oss-20b if the primary is unavailable on the
 * account. Reasoning effort LOW (short constrained phrasing), plain-text output.
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const PRIMARY_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const FALLBACK_MODEL = "openai/gpt-oss-20b";
const TIMEOUT_MS = 10_000;

// In-memory narrative cache, keyed by stable business id. Ad-hoc form posts all
// share the id "custom" with different inputs, so they are never cached here.
const cache = new Map<string, string>();

type ChatMessage = { role: "system" | "user"; content: string };

export async function narrate(core: CoreAssessment, business: BusinessMeta): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null; // feature flag: no key → deterministic render, as today

  const cacheable = business.id !== "custom";
  if (cacheable) {
    const hit = cache.get(business.id);
    if (hit) return hit;
  }

  try {
    // Lazy import keeps the SDK off the no-key path and out of the client bundle.
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL, timeout: TIMEOUT_MS, maxRetries: 0 });

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(core, business) },
    ];

    const raw = await complete(client, PRIMARY_MODEL, messages).catch((err) =>
      isModelUnavailable(err) ? complete(client, FALLBACK_MODEL, messages) : Promise.reject(err),
    );

    const text = sanitize(raw);
    if (!text) return null;
    if (cacheable) cache.set(business.id, text); // never cache failures
    return text;
  } catch {
    return null; // any error/timeout → deterministic fallback, never throws
  }
}

// One chat completion. `reasoning_effort` is a Groq/gpt-oss param not in the
// OpenAI types, so params are widened. Plain-text prose (no structured output).
async function complete(
  client: import("openai").default,
  model: string,
  messages: ChatMessage[],
): Promise<string | null> {
  const params = {
    model,
    messages,
    temperature: 0.3,
    max_completion_tokens: 800, // room for LOW reasoning + a ~55-word answer
    reasoning_effort: "low",
  };
  const res = await client.chat.completions.create(params as never);
  // Narrowed access — the create() overload return is widened by the cast above.
  const choice = (res as { choices?: Array<{ message?: { content?: string | null } }> }).choices?.[0];
  return choice?.message?.content ?? null;
}

function sanitize(text: string | null): string | null {
  if (!text) return null;
  // Belt-and-suspenders: strip any stray reasoning tags, collapse whitespace.
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/\s+/g, " ").trim();
  return clean.length > 0 ? clean : null;
}

function isModelUnavailable(err: unknown): boolean {
  const e = err as { status?: number; message?: string; code?: string };
  const msg = String(e?.message ?? "").toLowerCase();
  const code = String(e?.code ?? "").toLowerCase();
  return (
    e?.status === 404 ||
    code.includes("model") ||
    msg.includes("decommission") ||
    msg.includes("does not exist") ||
    msg.includes("not found") ||
    msg.includes("model_not_found")
  );
}
