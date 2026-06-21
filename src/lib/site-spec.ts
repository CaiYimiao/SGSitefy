import { z } from "zod";

/**
 * The SITE SPEC — the contract between the two AI layers.
 * Claude EMITS this (what the site says & looks like); the build agents
 * CONSUME it (turn it into a real Next.js site from a template).
 * Keep required fields minimal so generation is robust; validate strictly here.
 */

export const LocalizedTextSchema = z.object({
  en: z.string(),
  zh: z.string().optional(),
});

const HeroSection = z.object({
  type: z.literal("hero"),
  eyebrow: LocalizedTextSchema.optional(),
  headline: LocalizedTextSchema,
  sub: LocalizedTextSchema.optional(),
  imageRef: z.string().optional(),
});

const AboutSection = z.object({
  type: z.literal("about"),
  heading: LocalizedTextSchema,
  body: z.array(LocalizedTextSchema).default([]),
  bullets: z.array(LocalizedTextSchema).optional(),
  imageRef: z.string().optional(),
});

const ServicesSection = z.object({
  type: z.literal("services"),
  heading: LocalizedTextSchema,
  items: z.array(z.object({ title: LocalizedTextSchema, desc: LocalizedTextSchema })).default([]),
});

const GallerySection = z.object({
  type: z.literal("gallery"),
  heading: LocalizedTextSchema,
  imageRefs: z.array(z.string()).default([]),
});

const ContactSection = z.object({
  type: z.literal("contact"),
  heading: LocalizedTextSchema,
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const LocationSection = z.object({
  type: z.literal("location"),
  heading: LocalizedTextSchema,
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const SectionSchema = z.discriminatedUnion("type", [
  HeroSection,
  AboutSection,
  ServicesSection,
  GallerySection,
  ContactSection,
  LocationSection,
]);

const SlotValueSchema = z.union([
  z.string(),
  z.object({ en: z.string(), zh: z.string().optional() }),
]);

export const SiteSpecSchema = z.object({
  meta: z.object({
    companyNameEn: z.string(),
    companyNameZh: z.string().optional(),
    template: z.string().default("industrial"),   // industry id
    templateId: z.string().optional(),            // full library template id
    bilingual: z.boolean().default(true),
  }),
  theme: z.object({
    primary: z.string(),
    accent: z.string(),
    neutral: z.string().optional(),
  }),
  seo: z.object({
    title: z.string(),
    description: z.string(),
  }),
  sections: z.array(SectionSchema).default([]),
  /** Flat slot map produced by the slot pipeline — consumed by the HTML renderer. */
  slots: z.record(SlotValueSchema).optional(),
  /** Sanitised AI-generated HTML per bespoke region id — injected by the renderer. */
  bespoke: z.record(z.string()).optional(),
});

export type SiteSpec = z.infer<typeof SiteSpecSchema>;
export type Section = z.infer<typeof SectionSchema>;

/**
 * JSON Schema mirror of the above, used as the Anthropic tool `input_schema`
 * so Claude returns structured output. Kept intentionally permissive; the zod
 * schema above is the strict validator.
 */
export const siteSpecJsonSchema = {
  type: "object",
  required: ["meta", "theme", "seo", "sections"],
  properties: {
    meta: {
      type: "object",
      required: ["companyNameEn"],
      properties: {
        companyNameEn: { type: "string" },
        companyNameZh: { type: "string" },
        template: { type: "string", description: "Template id, e.g. 'industrial'." },
        bilingual: { type: "boolean" },
      },
    },
    theme: {
      type: "object",
      required: ["primary", "accent"],
      properties: {
        primary: { type: "string", description: "Hex colour." },
        accent: { type: "string", description: "Hex colour." },
        neutral: { type: "string" },
      },
    },
    seo: {
      type: "object",
      required: ["title", "description"],
      properties: { title: { type: "string" }, description: { type: "string" } },
    },
    sections: {
      type: "array",
      description: "Ordered page sections. Use types: hero, about, services, gallery, contact, location.",
      items: {
        type: "object",
        required: ["type"],
        properties: {
          type: { type: "string", enum: ["hero", "about", "services", "gallery", "contact", "location"] },
          eyebrow: { $ref: "#/$defs/loc" },
          headline: { $ref: "#/$defs/loc" },
          heading: { $ref: "#/$defs/loc" },
          sub: { $ref: "#/$defs/loc" },
          body: { type: "array", items: { $ref: "#/$defs/loc" } },
          bullets: { type: "array", items: { $ref: "#/$defs/loc" } },
          items: {
            type: "array",
            items: { type: "object", properties: { title: { $ref: "#/$defs/loc" }, desc: { $ref: "#/$defs/loc" } } },
          },
          imageRef: { type: "string", description: "Id of a provided photo." },
          imageRefs: { type: "array", items: { type: "string" } },
          email: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
        },
      },
    },
  },
  $defs: {
    loc: {
      type: "object",
      required: ["en"],
      properties: { en: { type: "string" }, zh: { type: "string" } },
    },
  },
} as const;
