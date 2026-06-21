import type { CompanyProfile } from "@/types/company-profile";

export type SlotKind = "chrome" | "factual" | "image" | "copy";

// Image slots — need src/href replacement not textContent
const IMAGE_RX = [
  /\.image\d?$/,
  /^gallery\.\d+$/,
  /^work\.\d+\.image$/,
  /^story\.image$/,
  /^about\.story\.image$/,
  /^cta\.image$/,
  /^feature\.image\d?$/,
  /^feature\d\.image$/,
  /^pricing\.image$/,
  /^menu\.image$/,
  /^process\.image$/,
  /^ethos\.figure$/,
];

// UI chrome — nav labels, buttons, meta titles — filled from i18n defaults
const CHROME_RX = [
  /^nav\./,
  /^meta\.title/,
  /^footer\.copy$/,
  /^hero\.cta\d?$/,
  /^hero\.link$/,
  /^cta\.button$/,
  /^cta\.btn$/,
  /^form\.(name|email|message|submit)$/,
  /^contact\.submit$/,
];

// Factual — contact/address info filled deterministically from company profile
const FACTUAL_RX = [
  /^contact\.(email|phone|address|addr|hours|transit)$/,
  /^contact\.(email|phone|address|addr|hours|transit)\./,
  /^quickinfo\./,
  /^brand(\.name)?$/,
  /^footer\.name$/,
  /^footer\.addr(ess)?$/,
  /^footer\.phone$/,
  /^footer\.email$/,
  /^foot\./,
  /^hours\./,
];

export function classifySlot(name: string): SlotKind {
  if (IMAGE_RX.some((r) => r.test(name))) return "image";
  if (CHROME_RX.some((r) => r.test(name))) return "chrome";
  if (FACTUAL_RX.some((r) => r.test(name))) return "factual";
  return "copy";
}

/** Extract all unique data-slot values from an HTML string. */
export function extractSlots(html: string): string[] {
  const seen = new Set<string>();
  for (const m of html.matchAll(/data-slot="([^"]+)"/g)) seen.add(m[1]);
  return [...seen];
}

/**
 * Extract bespoke regions a template declares for AI-generated custom HTML.
 * A template opts in with: <div data-bespoke="region-id" data-brief="what to build">
 * Returns [{ region, brief }] — empty if the template has no bespoke regions.
 */
export function extractBespokeRegions(html: string): { region: string; brief: string }[] {
  const out: { region: string; brief: string }[] = [];
  const seen = new Set<string>();
  // Match the opening tag carrying data-bespoke, in any attribute order
  for (const m of html.matchAll(/<[^>]*\bdata-bespoke="([^"]+)"[^>]*>/g)) {
    const region = m[1];
    if (seen.has(region)) continue;
    seen.add(region);
    const briefMatch = m[0].match(/\bdata-brief="([^"]*)"/);
    out.push({ region, brief: briefMatch?.[1] ?? "" });
  }
  return out;
}

/** Split a slot list into the four buckets. */
export function categorizeSlots(slots: string[]): {
  chrome: string[];
  factual: string[];
  image: string[];
  copy: string[];
} {
  const buckets = { chrome: [] as string[], factual: [] as string[], image: [] as string[], copy: [] as string[] };
  for (const s of slots) buckets[classifySlot(s)].push(s);
  return buckets;
}

// ---------------------------------------------------------------------------
// Chrome defaults — nav labels, button text, footer copyright
// ---------------------------------------------------------------------------
const CHROME_DEFAULTS: Record<string, string> = {
  "nav.home": "Home",
  "nav.about": "About",
  "nav.services": "Services",
  "nav.contact": "Contact",
  "nav.menu": "Menu",
  "nav.gallery": "Gallery",
  "nav.team": "Team",
  "nav.work": "Work",
  "nav.story": "Story",
  "nav.craft": "Craft",
  "nav.products": "Products",
  "nav.treatments": "Treatments",
  "nav.classes": "Classes",
  "nav.rituals": "Rituals",
  "nav.results": "Results",
  "nav.reviews": "Reviews",
  "nav.process": "Process",
  "nav.proof": "Proof",
  "nav.find": "Find Us",
  "nav.shop": "Shop",
  "nav.visit": "Visit",
  "nav.feat": "Featured",
  "nav.cat": "Categories",
  "nav.lang": "中文",
  "nav.cta": "Get in Touch",
  "cta.button": "Contact Us",
  "cta.btn": "Contact Us",
  "hero.cta": "Get in Touch",
  "hero.cta1": "Get in Touch",
  "hero.cta2": "View Our Work",
  "hero.link": "Learn More",
  "footer.copy": `© ${new Date().getFullYear()} · Built with SGSitefy`,
  "form.name": "Your Name",
  "form.email": "Email Address",
  "form.message": "Message",
  "form.submit": "Send Message",
  "contact.submit": "Send Message",
};

export function fillChromeSlots(slots: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of slots) {
    if (classifySlot(s) !== "chrome") continue;
    out[s] = CHROME_DEFAULTS[s] ?? "";
  }
  return out;
}

// ---------------------------------------------------------------------------
// Factual defaults — filled from company profile data
// ---------------------------------------------------------------------------
export function fillFactualSlots(
  slots: string[],
  profile: Partial<CompanyProfile>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of slots) {
    if (classifySlot(s) !== "factual") continue;

    // Label suffixes (.l, .label) → keep template default, leave blank
    if (s.endsWith(".l") || s.endsWith(".label")) { out[s] = ""; continue; }

    if (s === "brand.name" || s === "brand" || s === "footer.name") {
      out[s] = profile.nameEn ?? "";
    } else if (s.includes("email")) {
      out[s] = profile.email ?? "";
    } else if (s.includes("phone")) {
      out[s] = profile.phone ?? "";
    } else if (s.includes("addr") || s.includes("address")) {
      out[s] = profile.address ?? "";
    } else if (s.includes("hours") && s.endsWith(".v")) {
      out[s] = "Mon–Sat 9am–6pm";
    } else if (s.includes("hours")) {
      out[s] = "Mon–Sat 9am–6pm";
    } else if (s === "quickinfo.loc" || s === "quickinfo.loc.v") {
      out[s] = profile.address ?? "";
    } else if (s === "quickinfo.call" || s === "quickinfo.call.v") {
      out[s] = profile.phone ?? "";
    } else if (s === "quickinfo.diet" || s === "quickinfo.spec") {
      out[s] = "";
    } else {
      out[s] = profile.address ?? "";
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Image slot assignment — positional by upload order
// ---------------------------------------------------------------------------
export function fillImageSlots(
  slots: string[],
  photoUrls: string[]
): Record<string, string> {
  const imageSlots = slots.filter((s) => classifySlot(s) === "image");
  const out: Record<string, string> = {};
  imageSlots.forEach((s, i) => { out[s] = photoUrls[i] ?? ""; });
  return out;
}
