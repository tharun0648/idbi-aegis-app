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
