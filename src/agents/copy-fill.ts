/**
 * Copy-fill agent.
 * Takes the list of "copy" slots for the chosen library template and fills them
 * with bilingual EN/ZH business copy grounded in the company profile.
 * Runs in parallel with image-gen after brand-extractor completes.
 */

import { agChatJson, MODELS } from "@/lib/antigravity";
import type { CompanyProfile } from "@/types/company-profile";
import type { BrandDecision } from "@/agents/brand-extractor";

export type SlotValue = { en: string; zh?: string } | string;
export type SlotMap = Record<string, SlotValue>;

const SYSTEM = `You are SitefyAI, the bilingual copywriter for SGSitefy — landing pages for Singapore SMEs.

Your response MUST be a single JSON object. Start with { and end with }. No text before {. No text after }. No markdown. No fences.

You will receive:
- company: business profile and one-sentence description
- industryVibe: 2-4 word craft descriptor for this specific business
- templateSections: the sections this template contains (context only)
- slots: array of slot names you must fill

Return a flat JSON object where EVERY key is a slot name from the slots array.

SLOT NAMING GUIDE (dot-notation: section.field):
- hero.headline / about.headline / services.headline → section main heading
- hero.sub / about.sub / hero.lede / intro.lede → supporting line below heading
- hero.eyebrow / hero.kick / hero.kicker → small label above heading (1–4 words, e.g. "Est. 1998" or "Certified MUIS Halal")
- hero.stat.n / trust.N.n / stats.N.n → a numeric stat (e.g. "25", "500+")
- hero.stat.l / trust.N.l / stats.N.l → label for that stat (e.g. "Years in business")
- services.N.title / services.N.desc → Nth service name + one-sentence description (0-indexed)
- about.p1 / about.p2 / about.body1 / about.body → body copy paragraph
- proof.N.quote / proof.N.text → customer testimonial text
- proof.N.author / proof.N.cite → reviewer name or company
- marquee.N / ribbon.N / ticker.N → short repeating brand line (3–5 words, punchy)
- process.N.title / process.N.desc → step name + description in a how-it-works section
- values.N.title / values.N.desc → a company value name + explanation
- cap.N.title / cap.N.desc → a capability name + description

TEXT SLOT FORMAT: use {"en":"...","zh":"..."} for any slot that takes human-readable copy.
PLAIN STRING slots (numbers, short labels with no Chinese equivalent): use a plain string.

Rules:
1. Fill EVERY slot in the slots array. No omissions. If genuinely unknown, write a short truthful fallback.
2. Grounding: every claim must trace to the provided profile/description. Never invent facts, years, awards, certifications, client names, or numbers that are not stated.
3. Stats/numbers: if the profile doesn't state a real figure, write a plausible range (e.g. "10+") not a made-up specific number.
4. Voice: confident, concrete, plain. Real Singapore business owner — not a marketing bot.
5. BANNED: "unlock", "elevate", "seamless", "empower", "leverage", "cutting-edge", "world-class", "your trusted partner", "we pride ourselves", "nestled in the heart of", "one-stop", "holistic".
6. Specifics beat adjectives: name the actual service, material, dish, or outcome. Not "high-quality" — say what it is.
7. Headlines ≤ 9 words. Sub/lede ≤ 22 words. Service titles ≤ 4 words. Service desc = 1 sentence.
8. Chinese (zh): idiomatic Simplified Chinese — NOT a literal word-for-word translation. Native phrasing, Chinese punctuation (，。！). Chinese says more in fewer characters.`;

export async function fillCopy(
  profile: Partial<CompanyProfile>,
  description: string,
  brand: BrandDecision,
  copySlots: string[],
  templateSections: string[]
): Promise<SlotMap> {
  if (copySlots.length === 0) return {};

  const result = await agChatJson<SlotMap>({
    model: MODELS.sonnet,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          company: { ...profile, description },
          industryVibe: brand.industryVibe,
          templateSections,
          slots: copySlots,
        }),
      },
    ],
    max_tokens: 3500,
    temperature: 0.3,
  });

  // Ensure every requested slot is present; agent sometimes misses a few
  for (const s of copySlots) {
    if (!(s in result)) result[s] = { en: "", zh: "" };
  }
  return result;
}
