import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveLibraryTemplate } from "@/lib/pick-library-template";
import type { SiteSpec } from "@/lib/site-spec";
import fs from "fs";
import * as cheerio from "cheerio";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await db.site.findUnique({ where: { slug } });
  const spec = site?.spec as unknown as SiteSpec | undefined;
  return {
    title: spec?.seo?.title ?? "SGSitefy",
    description: spec?.seo?.description ?? undefined,
  };
}

export default async function PublishedSite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await db.site.findUnique({
    where: { slug },
    include: { assets: true },
  });
  if (!site || !site.spec) notFound();

  const spec = site.spec as unknown as SiteSpec;
  const templateId = spec.meta.templateId;

  // If no library template is recorded, fall back to the old SiteRenderer
  if (!templateId) {
    const { SiteRenderer } = await import("@/components/site-renderer");
    const assets: Record<string, string> = Object.fromEntries(
      site.assets.map((a) => [a.slot ?? a.id, a.url])
    );
    return <SiteRenderer spec={spec} assets={assets} />;
  }

  // Load the chosen library template HTML
  const { template, htmlPath } = resolveLibraryTemplate(templateId);
  const rawHtml = fs.readFileSync(htmlPath, "utf-8");
  const $ = cheerio.load(rawHtml);

  // Build asset lookup: slot name → URL (from uploaded assets)
  const assetBySlot: Record<string, string> = Object.fromEntries(
    site.assets.map((a) => [a.slot ?? a.id, a.url])
  );

  const slots = (spec.slots ?? {}) as Record<
    string,
    { en: string; zh?: string } | string
  >;

  // Inject each slot
  for (const [slotName, value] of Object.entries(slots)) {
    const el = $(`[data-slot="${slotName}"]`);
    if (!el.length) continue;

    // Image slots — set src attribute
    if (el.is("img")) {
      const url =
        typeof value === "string"
          ? value
          : assetBySlot[slotName] ?? "";
      if (url) el.attr("src", url);
      continue;
    }

    // Text slots — prefer EN; set textContent
    const text =
      typeof value === "object" ? value.en : value;
    if (text) el.text(text);
  }

  // Inject uploaded asset images by slot name (overrides placeholder src)
  for (const [slotName, url] of Object.entries(assetBySlot)) {
    if (!url) continue;
    const el = $(`[data-slot="${slotName}"]`);
    if (el.is("img")) el.attr("src", url);
  }

  // Inject AI-generated bespoke HTML into declared regions (already sanitised
  // at build time). Replaces the region's placeholder content.
  const bespoke = (spec.bespoke ?? {}) as Record<string, string>;
  for (const [region, html] of Object.entries(bespoke)) {
    if (!html) continue;
    const el = $(`[data-bespoke="${region}"]`);
    if (el.length) el.html(html);
  }

  // Inject brand CSS variables into <head>
  const cssVars = buildCssVars(spec.theme, template.tokens ?? {});
  $("head").prepend(`<style>:root{${cssVars}}</style>`);

  // Inject SEO meta if not already present
  if (!$('meta[name="description"]').length && spec.seo.description) {
    $("head").append(`<meta name="description" content="${escAttr(spec.seo.description)}" />`);
  }
  if (!$("title").length) {
    $("head").append(`<title>${escHtml(spec.seo.title)}</title>`);
  } else {
    $("title").text(spec.seo.title);
  }

  const finalHtml = $.html();
  return new Response(finalHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  }) as unknown as React.ReactElement;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCssVars(
  theme: SiteSpec["theme"],
  tokens: Record<string, string>
): string {
  // Map common token names → our brand colors
  const vars: Record<string, string> = {
    "--brand": theme.primary,
    "--accent": theme.accent,
    "--bg": theme.neutral ?? tokens.bg ?? "#f9f7f4",
    "--ink": tokens.ink ?? "#1a1916",
    "--surface": tokens.surface ?? "#f0ede4",
  };
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

function escAttr(s: string) {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
