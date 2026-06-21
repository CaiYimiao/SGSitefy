import { NextResponse } from "next/server";
import { lookupUen } from "@/lib/acra";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const uen = String(body?.uen ?? "").trim().toUpperCase();
  if (!uen) return NextResponse.json({ error: "UEN is required" }, { status: 400 });
  const profile = await lookupUen(uen);
  return NextResponse.json({ profile });
}
