import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createSite } from "@/lib/site-store";
import { inngest } from "@/lib/inngest/client";

/**
 * Async build entrypoint: provisions a draft Site + Build, then enqueues the
 * Inngest job. Returns a buildId the client can poll at /api/builds/[id].
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const profile = body?.profile ?? {};
    const photos = Array.isArray(body?.photos) ? body.photos : [];
    const description = String(body?.description ?? "");

    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    const { siteId, slug } = await createSite({
      profile,
      userId,
      nameEn: profile?.nameEn || "My Company",
      status: "BUILDING",
    });
    const build = await db.build.create({ data: { siteId, status: "QUEUED" } });

    await inngest.send({
      name: "site/build.requested",
      data: { buildId: build.id, siteId, profile, description, photos },
    });

    return NextResponse.json({ buildId: build.id, slug });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
