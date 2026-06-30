import { NextResponse } from "next/server";
import { validateProfile } from "@/engine/profileSchema";
import { assessAdHoc } from "@/engine/assessmentAdapter";

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

  const assessment = await assessAdHoc(result.profile);
  return NextResponse.json({ ok: true, assessment });
}
