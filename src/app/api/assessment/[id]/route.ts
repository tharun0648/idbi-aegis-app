import { NextResponse } from "next/server";
import { getAssessment } from "@/engine/assessmentAdapter";

// GET /api/assessment/:id  ->  EnrichedAssessment
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) {
    return NextResponse.json({ error: `No business with id "${id}"` }, { status: 404 });
  }
  return NextResponse.json(assessment);
}
