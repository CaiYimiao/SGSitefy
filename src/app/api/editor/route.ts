/**
 * POST /api/editor
 * SitefyAI editor endpoint — parse edit intent + apply patch to SiteSpec.
 * Body: { message: string, spec: SiteSpec }
 * Response: { intent, spec } — patched spec + the parsed intent (for UI feedback)
 */

import { NextRequest, NextResponse } from "next/server";
import { parseEditor } from "@/agents/parser";
import { applyEdit } from "@/agents/sitefyai-editor";
import { SiteSpecSchema } from "@/lib/site-spec";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, spec: rawSpec } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const specParsed = SiteSpecSchema.safeParse(rawSpec);
  if (!specParsed.success) {
    return NextResponse.json({ error: "invalid spec" }, { status: 400 });
  }

  const intent = await parseEditor(message);

  if (intent.type === "go_live") {
    // go_live doesn't change the spec — client handles the Go Live panel
    return NextResponse.json({ intent, spec: specParsed.data });
  }

  const patched = await applyEdit(specParsed.data, intent);
  return NextResponse.json({ intent, spec: patched });
}
