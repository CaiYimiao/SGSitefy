import { z } from "zod";
import { LocalizedTextSchema, type SiteSpec, type Section } from "@/lib/site-spec";
import type { CompanyProfile } from "@/types/company-profile";

/**
 * INDUSTRY TEMPLATES — the token-cost + quality lever.
 *
 * Instead of asking SitefyAI to invent the whole SiteSpec (structure + theme +
 * every section + all copy), we hand-design one template per generalized SME
 * industry: fixed section composition, order, and theme. SitefyAI then fills
 * ONLY the copy slots (TemplateContent — a fraction of the tokens), and we
 * assemble the full SiteSpec deterministically. Layout quality is guaranteed
 * because it's pre-designed, and output tokens drop dramatically.
 */

export type SectionType = "hero" | "about" | "services" | "gallery" | "location" | "contact";

export interface IndustryTemplate {
  id: string;
  label: string;
  keywords: string[]; // matched against SSIC + description to route the template
  theme: { primary: string; accent: string };
  sections: SectionType[]; // composition + order
  serviceCount: number; // how many service items SitefyAI should write
}

export const TEMPLATES: IndustryTemplate[] = [
  {
    id: "industrial",
    label: "Industrial / Engineering",
    keywords: ["fabricat", "engineering", "metal", "manufactur", "machin", "construction", "welding", "steel", "precision", "mechanical", "aircon", "ventilation"],
    theme: { primary: "#11264f", accent: "#f5b21a" },
    sections: ["hero", "about", "services", "gallery", "location", "contact"],
    serviceCount: 6,
  },
  {
    id: "fnb",
    label: "Food & Beverage",
    keywords: ["food", "restaurant", "cafe", "bakery", "catering", "beverage", "kitchen", "eatery", "coffee", "bar", "confection"],
    theme: { primary: "#7c2d12", accent: "#f59e0b" },
    sections: ["hero", "about", "services", "gallery", "location", "contact"],
    serviceCount: 4,
  },
  {
    id: "retail",
    label: "Retail / Trading",
    keywords: ["retail", "shop", "store", "trading", "wholesale", "supplies", "merchandise", "distributor", "import", "export"],
    theme: { primary: "#1f2937", accent: "#ef4444" },
    sections: ["hero", "about", "services", "gallery", "contact"],
    serviceCount: 4,
  },
  {
    id: "wellness",
    label: "Clinic / Wellness / Beauty",
    keywords: ["clinic", "dental", "medical", "health", "salon", "spa", "beauty", "wellness", "fitness", "gym", "aesthetic", "therapy", "tcm"],
    theme: { primary: "#0f766e", accent: "#14b8a6" },
    sections: ["hero", "about", "services", "location", "contact"],
    serviceCount: 4,
  },
  {
    id: "services",
    label: "Professional Services",
    keywords: ["consult", "agency", "accounting", "legal", "logistics", "cleaning", "renovation", "interior", "marketing", "software", "design", "education", "tuition"],
    theme: { primary: "#1e3a8a", accent: "#6366f1" },
    sections: ["hero", "about", "services", "contact"],
    serviceCount: 4,
  },
];

const DEFAULT = TEMPLATES.find((t) => t.id === "services")!;

/** Deterministic routing — no tokens spent choosing a layout. */
export function pickTemplate(profile: Partial<CompanyProfile>, description: string): IndustryTemplate {
  const hay = `${profile.ssic ?? ""} ${description}`.toLowerCase();
  return TEMPLATES.find((t) => t.keywords.some((k) => hay.includes(k))) ?? DEFAULT;
}

/** The small payload SitefyAI actually generates (copy only). */
export const TemplateContentSchema = z.object({
  heroEyebrow: LocalizedTextSchema,
  heroHeadline: LocalizedTextSchema,
  heroSub: LocalizedTextSchema,
  aboutHeading: LocalizedTextSchema,
  aboutBody: z.array(LocalizedTextSchema).min(1).max(3),
  bullets: z.array(LocalizedTextSchema).max(5).optional(),
  servicesHeading: LocalizedTextSchema,
  services: z.array(z.object({ title: LocalizedTextSchema, desc: LocalizedTextSchema })),
  contactHeading: LocalizedTextSchema,
  galleryHeading: LocalizedTextSchema.optional(),
  seoTitle: z.string(),
  seoDescription: z.string(),
});
export type TemplateContent = z.infer<typeof TemplateContentSchema>;

const loc = { type: "object", required: ["en"], properties: { en: { type: "string" }, zh: { type: "string" } } };

/** JSON Schema for the Anthropic tool — small, so output tokens stay low. */
export const templateContentJsonSchema = {
  type: "object",
  required: ["heroEyebrow", "heroHeadline", "heroSub", "aboutHeading", "aboutBody", "servicesHeading", "services", "contactHeading", "seoTitle", "seoDescription"],
  properties: {
    heroEyebrow: loc,
    heroHeadline: loc,
    heroSub: loc,
    aboutHeading: loc,
    aboutBody: { type: "array", items: loc, description: "1–3 short paragraphs." },
    bullets: { type: "array", items: loc, description: "Up to 5 short selling points." },
    servicesHeading: loc,
    services: { type: "array", items: { type: "object", properties: { title: loc, desc: loc } } },
    contactHeading: loc,
    galleryHeading: loc,
    seoTitle: { type: "string" },
    seoDescription: { type: "string" },
  },
} as const;

/** Deterministically assemble a full SiteSpec from a template + filled content. No tokens. */
export function assembleSiteSpec(
  tpl: IndustryTemplate,
  c: TemplateContent,
  profile: Partial<CompanyProfile>,
  photoIds: string[]
): SiteSpec {
  const sections: Section[] = [];
  for (const s of tpl.sections) {
    if (s === "hero") sections.push({ type: "hero", eyebrow: c.heroEyebrow, headline: c.heroHeadline, sub: c.heroSub, imageRef: photoIds[0] });
    else if (s === "about") sections.push({ type: "about", heading: c.aboutHeading, body: c.aboutBody, bullets: c.bullets, imageRef: photoIds[1] });
    else if (s === "services") sections.push({ type: "services", heading: c.servicesHeading, items: c.services });
    else if (s === "gallery") sections.push({ type: "gallery", heading: c.galleryHeading ?? { en: "Our Work", zh: "工程实例" }, imageRefs: photoIds.slice(2, 8) });
    else if (s === "location") sections.push({ type: "location", heading: { en: "Find Us", zh: "我们的位置" }, address: profile.address, lat: profile.lat, lng: profile.lng });
    else if (s === "contact") sections.push({ type: "contact", heading: c.contactHeading, address: profile.address, phone: profile.phone, email: profile.email });
  }
  return {
    meta: { companyNameEn: profile.nameEn ?? "Company", companyNameZh: profile.nameZh, template: tpl.id, bilingual: true },
    theme: { primary: tpl.theme.primary, accent: tpl.theme.accent },
    seo: { title: c.seoTitle, description: c.seoDescription },
    sections,
  };
}
