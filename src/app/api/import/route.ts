import { NextResponse } from "next/server";
import { importFromUrl } from "@/lib/import";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { url } = await req.json().catch(() => ({}));
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    const data = await importFromUrl(String(url));
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
