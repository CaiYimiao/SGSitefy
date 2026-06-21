/**
 * Brand-extractor agent.
 * Input: company profile + description.
 * Output: brand colors, style direction, and placement hints for nanobanana2 images.
 * This fans out to copy-fill and image-gen agents in parallel.
 */

import { agChatJson, extractBrandFromLogo, MODELS } from "@/lib/antigravity";
import type { CompanyProfile } from "@/types/company-profile";

export interface BrandDecision {
  /** Primary brand color as #RRGGBB — extracted from logo if available, otherwise AI-chosen */
  primary: string;
  /** Accent color as #RRGGBB */
  accent: string;
  /** Neutral/background tone */
  neutral: string;
  /** Overall visual personality — used to prompt Nano Banana */
  styleKeywords: string[];
  /** Where the uploaded/generated logo should appear */
  logoPlacement: "hero" | "nav" | "both";
  /** Whether to generate a hero image with Nano Banana Pro */
  generateHeroImage: boolean;
  /** Number of service icons to generate (0–4) via nanobanana2 */
  serviceIconCount: number;
  /** Industry vibe for prompting: e.g. "industrial welding", "halal food" */
  industryVibe: string;
  /** True when colors came from actual logo analysis (vs AI guess) */
  colorsFromLogo?: boolean;
}

const SYSTEM = `You are a brand strategist for Singapore SME websites.

Your response MUST be a single JSON object. Start your response with { and end with }. No text before {. No text after }. No markdown. No code fences. No explanation.

Required shape (all fields mandatory, exact key names):
{"primary":"#rrggbb","accent":"#rrggbb","neutral":"#rrggbb","styleKeywords":["str","str","str"],"logoPlacement":"nav","generateHeroImage":true,"serviceIconCount":3,"industryVibe":"str"}

Field rules:
- primary/accent/neutral: 6-digit lowercase hex only. Never #fff, #000, or an uppercase hex.
- If logoColors are provided in the input: copy primary/accent/neutral EXACTLY from them — do not change them.
- If no logoColors: choose a palette for THIS specific business. Banned: blue for tech, red for food, purple/indigo gradients, generic corporate colours.
- neutral: a near-white (#f7f4f0) for light or near-black (#14110f) for dark — whichever keeps primary legible as text on top.
- primary and accent must contrast ≥4.5:1 against neutral.
- styleKeywords: exactly 3-5 strings. Concrete visual cues only — "raw concrete texture" not "modern", "wok-hei steam macro" not "authentic".
- industryVibe: 2-4 words, specific craft — "precision laser cutting" not "manufacturing", "halal zi char" not "food".
- generateHeroImage: true unless photoCount ≥ 3.
- serviceIconCount: 0 if ≤1 service; 3 if 2-4 services; 4 if 5+ services.
- logoPlacement: "both" if nameEn is 15 characters or fewer, otherwise "nav".`;

export async function extractBrand(
  profile: Partial<CompanyProfile>,
  description: string,
  photoCount: number,
  /** URL or data URI of uploaded company logo — triggers real color extraction */
  logoUrl?: string
): Promise<BrandDecision> {
  // If a logo was uploaded, extract its actual colors first via Gemini vision
  let logoColors: { primary: string; accent: string; neutral: string; personality: string[] } | null = null;
  if (logoUrl) {
    logoColors = await extractBrandFromLogo(logoUrl);
  }

  const decision = await agChatJson<BrandDecision>({
    model: MODELS.worker,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: JSON.stringify({ profile, description, photoCount, logoColors }),
      },
    ],
    max_tokens: 512,
    temperature: 0.2,
  });

  // Enforce logo colors — the LLM sometimes ignores them despite the system prompt
  if (logoColors) {
    decision.primary = logoColors.primary;
    decision.accent  = logoColors.accent;
    decision.neutral = logoColors.neutral;
    // Merge logo personality into style keywords
    decision.styleKeywords = [
      ...logoColors.personality,
      ...decision.styleKeywords.filter((k) => !logoColors!.personality.includes(k)),
    ].slice(0, 5);
    decision.colorsFromLogo = true;
  }

  return decision;
}
