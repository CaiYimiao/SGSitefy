/**
 * Image-gen agent — Nano Banana Pro (hero/logo) + nanobanana2 (icons) via Antigravity.
 *
 * Tier strategy:
 *   Hero + logo  → gemini-3-pro-image-preview (Nano Banana Pro, ~$0.134/img, ~1/site)
 *   Service icons → nanobanana2 (FREE on Pro plan, at volume)
 *
 * Prompting philosophy:
 *   Generic prompts produce generic images. Every prompt here includes:
 *   - The company name + industry vibe (specificity = originality)
 *   - Brand color as a hex directive ("dominant color #RRGGBB")
 *   - A visual style drawn from brand personality keywords
 *   - A composition directive to avoid stock-photo clichés
 */

import { agImageGen, MODELS } from "@/lib/antigravity";

export interface GeneratedImages {
  logoUrl?: string;
  heroUrl?: string;
  serviceIconUrls: string[];
}

export interface BrandContext {
  styleKeywords: string[];
  industryVibe: string;
  generateHeroImage: boolean;
  serviceIconCount: number;
  /** Extracted from the uploaded logo — hex e.g. "#1A2B3C" */
  primaryHex?: string;
  accentHex?: string;
}

// ── PROMPT BUILDERS ─────────────────────────────────────────────────────────

function logoPrompt(name: string, ctx: BrandContext): string {
  const style = ctx.styleKeywords.slice(0, 3).join(", ");
  const color = ctx.primaryHex ? `, dominant brand color ${ctx.primaryHex}` : "";
  return (
    `Minimalist wordmark-free icon for a Singapore ${ctx.industryVibe} company called "${name}".` +
    ` Style: ${style}${color}. Vector-clean geometry, transparent background, no text, no clip art.` +
    ` Think: original abstract mark that would look sharp at 32px — not a generic industry clip-art symbol.` +
    ` Use negative space creatively. High contrast. Professional.`
  );
}

function heroPrompt(name: string, ctx: BrandContext): string {
  const style = ctx.styleKeywords.slice(0, 3).join(", ");
  const colorDir = ctx.primaryHex
    ? `Color grade: deep shadows pulled toward ${ctx.primaryHex}, highlights warm.`
    : "";
  return (
    `Hero banner photograph for "${name}", a Singapore ${ctx.industryVibe} business.` +
    ` ${style} aesthetic. ${colorDir}` +
    ` Composition: dramatic low-angle or wide establishing shot — NOT a generic stock-photo handshake or laptop.` +
    ` Show the actual work: tools, materials, space, craft, or product in action.` +
    ` Cinematic depth of field. No text overlay. Aspect ratio 16:9. Ultra sharp, magazine-grade.`
  );
}

function iconPrompt(
  name: string,
  idx: number,
  ctx: BrandContext,
  serviceHint?: string
): string {
  const style = ctx.styleKeywords.slice(0, 2).join(", ");
  const accent = ctx.accentHex ? `, accent color ${ctx.accentHex}` : "";
  const hint = serviceHint ? `(representing: ${serviceHint}) ` : `(service ${idx + 1}) `;
  return (
    `Flat icon ${hint}for a Singapore ${ctx.industryVibe} company "${name}".` +
    ` ${style} style${accent}. Single bold shape, white or transparent background.` +
    ` Original geometry — avoid emoji-style or FontAwesome-lookalike icons.` +
    ` Consistent stroke weight. Would work at 48×48px.`
  );
}

// ── MAIN GENERATOR ───────────────────────────────────────────────────────────

export async function generateImages(
  companyName: string,
  ctx: BrandContext,
  serviceHints?: string[]
): Promise<GeneratedImages> {
  const result: GeneratedImages = { serviceIconUrls: [] };
  const tasks: Promise<void>[] = [];

  // Logo — Nano Banana Pro (best quality, once per site)
  tasks.push(
    agImageGen({
      prompt: logoPrompt(companyName, ctx),
      aspect_ratio: "1:1",
      format: "png",
      model: MODELS.imagePro,
    }).then((img) => {
      result.logoUrl = img.url || img.dataUri;
    })
  );

  // Hero — Nano Banana Pro (the most impactful image on the page)
  if (ctx.generateHeroImage) {
    tasks.push(
      agImageGen({
        prompt: heroPrompt(companyName, ctx),
        aspect_ratio: "16:9",
        format: "webp",
        model: MODELS.imagePro,
      }).then((img) => {
        result.heroUrl = img.url || img.dataUri;
      })
    );
  }

  // Service icons — nanobanana2 (free on Pro, generated in parallel)
  const iconTasks = Array.from({ length: ctx.serviceIconCount }, (_, i) =>
    agImageGen({
      prompt: iconPrompt(companyName, i, ctx, serviceHints?.[i]),
      aspect_ratio: "1:1",
      format: "png",
      model: MODELS.imageFlash,
    }).then((img) => img.url || img.dataUri || "")
  );

  tasks.push(
    Promise.all(iconTasks).then((urls) => {
      result.serviceIconUrls = urls.filter(Boolean);
    })
  );

  await Promise.all(tasks);
  return result;
}
