/**
 * Bespoke-gen agent — AGENTIC.
 * For templates that declare custom regions (data-bespoke="region" with a
 * data-brief hint), this generates genuinely custom HTML/CSS per business via
 * Gemini — not slot-fill — then runs a self-critique → revise loop so the model
 * checks its own markup against the rules (CSS vars, no scripts, grounded,
 * bilingual, responsive, accessible) and repairs the regions that fail. Output
 * is sanitised before it ever reaches a page.
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

const REVIEW_SYSTEM = `You are a STRICT front-end reviewer for SGSitefy bespoke page sections.

You receive the business context and a map of region id → generated HTML. For each region, check the HTML against these rules and flag REAL violations only:
- Colours: must reference var(--brand/--accent/--bg/--ink/--surface), never hard-coded hex.
- No <script>, <style>, <link>, <iframe>, and no on* event handlers or javascript: URLs.
- Grounding: every word must trace to the provided business profile — no invented facts, numbers, awards, or names.
- Bilingual: prose text elements must carry data-en AND data-zh (idiomatic Simplified Chinese).
- Responsive (flex/grid that wraps) and accessible (semantic headings, alt text).
- No banned words: unlock, elevate, seamless, empower, world-class, one-stop, your trusted partner, nestled in the heart of.

Your response MUST be a single JSON object: {"revise":{"<region id>":"<what to fix>"}}. Only include regions that need fixing. If all regions are good, return {"revise":{}}. No text before { or after }. No markdown.`;

function parseMap(raw: string): Record<string, string> {
  try {
    const stripped = raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? raw;
    return JSON.parse(stripped.trim());
  } catch {
    return {};
  }
}

/** Generate sanitised bespoke HTML for each declared region (with self-review). */
export async function generateBespokeRegions(
  profile: Partial<CompanyProfile>,
  description: string,
  brand: BrandDecision,
  regions: BespokeRegion[],
  photoUrls: string[] = []
): Promise<Record<string, string>> {
  if (regions.length === 0) return {};

  const ctx = { company: { ...profile, description }, industryVibe: brand.industryVibe, availablePhotos: photoUrls };

  // 1) Generate
  let parsed: Record<string, string>;
  try {
    parsed = parseMap(await agChat({
      model: MODELS.worker,
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify({ ...ctx, regions }) }],
      max_tokens: 4000,
      temperature: 0.5,
    }));
  } catch {
    return {}; // generation failed → template defaults stay in place
  }
  if (Object.keys(parsed).length === 0) return {};

  // 2) Self-critique → 3) revise flagged regions (best-effort)
  try {
    const reviewRaw = await agChat({
      model: MODELS.worker,
      system: REVIEW_SYSTEM,
      messages: [{ role: "user", content: JSON.stringify({ ...ctx, html: parsed }) }],
      max_tokens: 1500,
      temperature: 0,
    });
    const revise = (parseMap(reviewRaw) as { revise?: Record<string, string> }).revise ?? {};
    const toFix = Object.keys(revise).filter((r) => r in parsed);
    if (toFix.length) {
      const fixRaw = await agChat({
        model: MODELS.worker,
        system: SYSTEM,
        messages: [{
          role: "user",
          content: JSON.stringify({
            ...ctx,
            regions: regions.filter((r) => toFix.includes(r.region)),
            previousAttempt: Object.fromEntries(toFix.map((r) => [r, parsed[r]])),
            fixes: Object.fromEntries(toFix.map((r) => [r, revise[r]])),
            instruction: "Regenerate ONLY these regions, fixing the noted problems. Same JSON output format.",
          }),
        }],
        max_tokens: 4000,
        temperature: 0.4,
      });
      const fixed = parseMap(fixRaw);
      for (const r of toFix) {
        if (typeof fixed[r] === "string" && fixed[r].trim()) parsed[r] = fixed[r];
      }
    }
  } catch {
    /* keep the first-pass output if review/revise fails */
  }

  // Sanitise every block before it can reach a page
  const out: Record<string, string> = {};
  for (const { region } of regions) {
    const html = parsed[region];
    if (typeof html === "string" && html.trim()) out[region] = sanitizeHtml(html);
  }
  return out;
}
