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

    // One UEN = one site. Block a duplicate build for a UEN this user already
    // has (failed sites are excluded so they can retry).
    const uen = typeof profile?.uen === "string" ? profile.uen.trim() : "";
    if (userId && uen) {
      const dup = await db.site.findFirst({
        where: {
          org: { members: { some: { userId } }, company: { is: { uen } } },
          status: { not: "FAILED" },
        },
        select: { slug: true },
      });
      if (dup) {
        return NextResponse.json(
          { error: `You already have a site for UEN ${uen}. Edit or delete it from your dashboard first.`, slug: dup.slug },
          { status: 409 }
        );
      }
    }

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
