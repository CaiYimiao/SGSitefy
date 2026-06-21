import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const build = await db.build.findUnique({ where: { id }, include: { site: true } });
  if (!build) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    status: build.status,
    previewUrl: build.previewUrl,
    slug: build.site.slug,
  });
}
