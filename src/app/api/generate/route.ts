import { NextResponse } from "next/server";
import { generateSiteSpec } from "@/lib/anthropic";

// Generation can take a while; allow up to 60s on Vercel.
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const spec = await generateSiteSpec({
      profile: body?.profile ?? {},
      description: String(body?.description ?? ""),
      photoIds: Array.isArray(body?.photoIds) ? body.photoIds : [],
    });
    return NextResponse.json({ spec });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
