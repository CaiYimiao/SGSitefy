import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** DELETE /api/sites/[id] — remove a site the signed-in user owns. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const site = await db.site.findUnique({
    where: { id },
    include: { org: { include: { members: true } } },
  });
  if (!site) return NextResponse.json({ error: "not found" }, { status: 404 });
  const owns = site.org.members.some((m) => m.userId === uid);
  if (!owns) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Assets + Builds have no cascade, so remove them before the site.
  await db.$transaction([
    db.asset.deleteMany({ where: { siteId: id } }),
    db.build.deleteMany({ where: { siteId: id } }),
    db.site.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
