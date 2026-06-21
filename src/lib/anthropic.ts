/**
 * Legacy entry point — kept so existing imports don't break.
 * All calls now route through Antigravity (see src/lib/antigravity.ts).
 * The Anthropic SDK baseURL is overridden to point at Antigravity's endpoint.
 */

import Anthropic from "@anthropic-ai/sdk";
import { SiteSpecSchema, type SiteSpec } from "@/lib/site-spec";
import {
  pickTemplate,
  assembleSiteSpec,
  TemplateContentSchema,
  templateContentJsonSchema,
} from "@/lib/templates";
import type { CompanyProfile } from "@/types/company-profile";

// Route the Anthropic SDK through Antigravity by overriding baseURL.
// Set ANTIGRAVITY_BASE_URL and ANTIGRAVITY_API_KEY in .env.local
const client = new Anthropic({
  apiKey: process.env.ANTIGRAVITY_API_KEY ?? "",
  baseURL: process.env.ANTIGRAVITY_BASE_URL,
});

const MODEL = "claude-haiku-4-5";

const SYSTEM = `You are SitefyAI, the copywriter for SGSitefy (landing pages for Singapore SMEs).
You are given a chosen page template and a company's data. Write ONLY the copy that fills the template's slots — do NOT invent structure, sections or layout.

Hard rules:
- Ground EVERY claim only in the data provided. Never invent facts, figures, awards, certifications or client names.
- Confident, professional SME voice. Concise and conversion-oriented.
- Bilingual: fill BOTH "en" and "zh" (Simplified Chinese) for every localized field.
- Write exactly the number of services requested.
- Always call the emit_content tool; never reply in prose.`;

export async function generateSiteSpec(input: {
  profile: Partial<CompanyProfile>;
  description: string;
  photoIds: string[];
}): Promise<SiteSpec> {
  const tpl = pickTemplate(input.profile, input.description);

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    tools: [
      {
        name: "emit_content",
        description: `Write the copy for the "${tpl.label}" template. Provide exactly ${tpl.serviceCount} services.`,
        input_schema: templateContentJsonSchema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "emit_content" },
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          company: input.profile,
          description: input.description,
          template: tpl.label,
          serviceCount: tpl.serviceCount,
          availablePhotoIds: input.photoIds,
        }),
      },
    ],
  });

  const toolUse = msg.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("SitefyAI did not return content.");
  }

  const parsed = TemplateContentSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error("Generated content failed validation: " + parsed.error.message);
  }

  const spec = assembleSiteSpec(tpl, parsed.data, input.profile, input.photoIds);

  const valid = SiteSpecSchema.safeParse(spec);
  if (!valid.success) throw new Error("Assembled site spec invalid: " + valid.error.message);
  return valid.data;
}
