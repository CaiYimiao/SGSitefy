/**
 * Bespoke-gen agent.
 * For templates that declare custom regions (data-bespoke="region" with a
 * data-brief hint), this generates genuinely custom HTML/CSS per business via
 * Gemini — not slot-fill. Output is sanitised before it ever reaches a page.
 *
 * This is the "agent writes custom markup" path. It's still a single inference
 * call per build (fast + cheap), NOT a sandboxed coding agent.
 */

import { agChat, MODELS } from "@/lib/antigravity";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { CompanyProfile } from "@/types/company-profile";
import type { BrandDecision } from "@/agents/brand-extractor";

export interface BespokeRegion {
  /** region id, e.g. "hero-feature" */
  region: string;
  /** what this region should contain, from data-brief on the template element */
  brief: string;
}

const SYSTEM = `You are SitefyAI's bespoke front-end builder for SGSitefy — landing pages for Singapore SMEs.

You generate CUSTOM HTML for specific page regions, themed to one business. Each region is bespoke — invent layout and structure that fits THIS business, not a generic template.

Your response MUST be a single JSON object. Start with { and end with }. No text before {. No text after }. No markdown. No code fences.

The JSON maps each region id to an HTML string:
{"region-id":"<div class=\\"...\\">...</div>", "other-region":"..."}

THEMING — use these CSS custom properties (already defined on the page, do NOT redefine them):
- var(--brand)   = primary brand colour
- var(--accent)  = accent colour
- var(--bg)      = page background
- var(--ink)     = body text colour
- var(--surface) = raised surface colour
Style with inline style="..." attributes referencing these vars, or Tailwind-like utility classes if you prefer, but NEVER hard-code hex colours — always reference the vars so the brand theme drives the look.

HARD RULES:
1. Output ONLY the inner HTML for each region — no <html>, <head>, <body>, <script>, <style>, <link>, or <iframe> tags. Inline styles only.
2. No JavaScript. No event handlers (onclick etc.). No external resources except <img> with the provided photo URLs.
3. Self-contained: each region is a complete visual block (section/div) with its own spacing.
4. Responsive: use flex/grid with wrapping; readable on mobile.
5. Grounding: every word must trace to the provided business profile/description. Invent NO facts, numbers, awards, or names.
6. Bilingual: where there is prose, add data-en and data-zh attributes on the text element so the page's language toggle works. Put the English in the visible text and data-en; idiomatic Simplified Chinese in data-zh.
7. Accessibility: alt text on images, semantic headings (h2/h3), sufficient contrast.
8. Voice: concrete and plain. BANNED words: unlock, elevate, seamless, empower, world-class, one-stop, your trusted partner, nestled in the heart of.`;

/** Generate sanitised bespoke HTML for each declared region. */
export async function generateBespokeRegions(
  profile: Partial<CompanyProfile>,
  description: string,
  brand: BrandDecision,
  regions: BespokeRegion[],
  photoUrls: string[] = []
): Promise<Record<string, string>> {
  if (regions.length === 0) return {};

  let raw: string;
  try {
    raw = await agChat({
      model: MODELS.worker,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            company: { ...profile, description },
            industryVibe: brand.industryVibe,
            availablePhotos: photoUrls,
            regions,
          }),
        },
      ],
      max_tokens: 4000,
      temperature: 0.5,
    });
  } catch {
    return {}; // generation failed → template defaults stay in place
  }

  let parsed: Record<string, string>;
  try {
    const stripped = raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? raw;
    parsed = JSON.parse(stripped.trim());
  } catch {
    return {};
  }

  // Sanitise every generated block before it can reach a page
  const out: Record<string, string> = {};
  for (const { region } of regions) {
    const html = parsed[region];
    if (typeof html === "string" && html.trim()) {
      out[region] = sanitizeHtml(html);
    }
  }
  return out;
}
