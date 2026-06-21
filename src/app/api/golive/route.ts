/**
 * POST /api/golive
 * Kicks off the go-live Inngest workflow.
 * Body: { siteId: string, domain: string, registrar: "cloudflare" | "namecheap" | "godaddy" }
 */

import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId, domain, registrar } = await req.json();

  if (!siteId || !domain || !registrar) {
    return NextResponse.json({ error: "siteId, domain, registrar required" }, { status: 400 });
  }

  const validRegistrars = ["cloudflare", "namecheap", "godaddy"];
  if (!validRegistrars.includes(registrar)) {
    return NextResponse.json({ error: "invalid registrar" }, { status: 400 });
  }

  await inngest.send({
    name: "site/go-live.requested",
    data: { siteId, domain, registrar, userId: session.user.id },
  });

  return NextResponse.json({ queued: true });
}
