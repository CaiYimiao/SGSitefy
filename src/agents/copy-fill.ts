/**
 * Copy-fill agent — AGENTIC.
 * Generates bilingual EN/ZH copy for the template's "copy" slots, then runs a
 * self-critique → revise loop: a strict editor pass flags any slot that breaks
 * the rules (ungrounded claims, banned words, over-length, weak Chinese), and a
 * revise pass fixes only those slots. This is the "checks its own work" loop —
 * the model has to defend and repair its output before it ships.
 */

import { agChatJson, MODELS } from "@/lib/antigravity";
import type { CompanyProfile } from "@/types/company-profile";
import type { BrandDecision } from "@/agents/brand-extractor";

export type SlotValue = { en: string; zh?: string } | string;
export type SlotMap = Record<string, SlotValue>;

const RULES = `Rules:
1. Grounding: every claim must trace to the provided profile/description. Never invent facts, years, awards, certifications, client names, or numbers that are not stated.
2. Stats/numbers: if the profile doesn't state a real figure, write a plausible range (e.g. "10+") not a made-up specific number.
3. Voice: confident, concrete, plain. A real Singapore business owner — not a marketing bot.
4. BANNED words/phrases: "unlock", "elevate", "seamless", "empower", "leverage", "cutting-edge", "world-class", "your trusted partner", "we pride ourselves", "nestled in the heart of", "one-stop", "holistic".
5. Specifics beat adjectives: name the actual service, material, dish, or outcome. Not "high-quality" — say what it is.
6. Length: headlines ≤ 9 words. Sub/lede ≤ 22 words. Service titles ≤ 4 words. Service desc = 1 sentence.
7. Chinese (zh): idiomatic Simplified Chinese — NOT a literal word-for-word translation. Native phrasing, Chinese punctuation (，。！).`;

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

Fill EVERY slot in the slots array. No omissions. If genuinely unknown, write a short truthful fallback.

${RULES}`;

const REVIEW_SYSTEM = `You are a STRICT copy editor reviewing a draft of an SGSitefy SME landing page.

You receive the business context and a draft of filled copy slots. Find every slot whose value breaks the rules below. Be strict, but only flag REAL problems — do not nitpick good copy.

${RULES}

Your response MUST be a single JSON object: {"issues":[{"slot":"<slot name>","problem":"<short reason>"}]}. If every slot is good, return {"issues":[]}. No text before { or after }. No markdown.`;

const REVISE_SYSTEM = `You are SitefyAI repairing specific copy slots that an editor flagged.

You receive the business context and a list of {slot, problem}. Return a single JSON object mapping ONLY the flagged slot names to corrected values, in the same format as the original ({"en":"...","zh":"..."} for prose, or a plain string for numbers/labels). Fix the stated problem while obeying all the rules.

${RULES}

No text before { or after }. No markdown. No fences.`;

interface Ctx {
  company: Record<string, unknown>;
  industryVibe: string;
}

async function review(filled: SlotMap, ctx: Ctx): Promise<{ slot: string; problem: string }[]> {
  const res = await agChatJson<{ issues?: { slot: string; problem: string }[] }>({
    model: MODELS.worker,
    system: REVIEW_SYSTEM,
    messages: [{ role: "user", content: JSON.stringify({ ...ctx, draft: filled }) }],
    max_tokens: 1200,
    temperature: 0,
  });
  return (res.issues ?? []).filter((i) => i && i.slot);
}

async function revise(
  issues: { slot: string; problem: string }[],
  ctx: Ctx
): Promise<SlotMap> {
  return agChatJson<SlotMap>({
    model: MODELS.sonnet,
    system: REVISE_SYSTEM,
    messages: [{ role: "user", content: JSON.stringify({ ...ctx, flagged: issues }) }],
    max_tokens: 2000,
    temperature: 0.3,
  });
}

export async function fillCopy(
  profile: Partial<CompanyProfile>,
  description: string,
  brand: BrandDecision,
  copySlots: string[],
  templateSections: string[]
): Promise<SlotMap> {
  if (copySlots.length === 0) return {};

  const ctx: Ctx = {
    company: { ...profile, description },
    industryVibe: brand.industryVibe,
  };

  // 1) Generate
  const result = await agChatJson<SlotMap>({
    model: MODELS.sonnet,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify({ ...ctx, templateSections, slots: copySlots }) }],
    max_tokens: 3500,
    temperature: 0.3,
  });

  // Ensure every requested slot is present; the model sometimes misses a few.
  for (const s of copySlots) {
    if (!(s in result)) result[s] = { en: "", zh: "" };
  }

  // 2) Self-critique → 3) revise (best-effort: never let the loop break a build)
  try {
    const issues = await review(result, ctx);
    const flagged = issues.filter((i) => copySlots.includes(i.slot));
    if (flagged.length) {
      const fixes = await revise(flagged, ctx);
      for (const [slot, value] of Object.entries(fixes)) {
        if (copySlots.includes(slot) && value != null) result[slot] = value;
      }
    }
  } catch {
    /* keep the first-pass draft if review/revise fails */
  }

  return result;
}
