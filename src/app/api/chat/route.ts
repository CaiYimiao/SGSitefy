/**
 * POST /api/chat
 * SitefyAI chatbot endpoint — main page FAQ mode.
 * Body: { message: string }
 * Response: { type, answer?, ... } — the raw MainPageIntent
 */

import { NextRequest, NextResponse } from "next/server";
import { parseMainPage } from "@/agents/parser";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const intent = await parseMainPage(message);

  if (intent.type === "faq") {
    return NextResponse.json({ type: "faq", answer: intent.answer });
  }
  if (intent.type === "start_wizard") {
    return NextResponse.json({ type: "start_wizard" });
  }
  if (intent.type === "pricing") {
    return NextResponse.json({
      type: "faq",
      answer:
        "SGSitefy is free to generate your site. Going live with a custom domain starts from the cost of your domain (~$15–25/yr via Cloudflare, Namecheap, or GoDaddy). No hidden fees.",
    });
  }

  return NextResponse.json({
    type: "faq",
    answer: "I'm here to help with SGSitefy! Ask me anything about getting your business online.",
  });
}
