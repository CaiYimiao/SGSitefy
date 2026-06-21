import { NextResponse } from "next/server";
import { buildAndPersistSite } from "@/lib/build";
import { SiteSpecSchema } from "@/lib/site-spec";
import { auth } from "@/auth";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = SiteSpecSchema.safeParse(body?.spec);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid site spec" }, { status: 400 });
    }
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    const result = await buildAndPersistSite({
      spec: parsed.data,
      profile: body?.profile ?? {},
      photos: Array.isArray(body?.photos) ? body.photos : [],
      userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
