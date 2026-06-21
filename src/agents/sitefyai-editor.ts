/**
 * SitefyAI editor agent.
 * Runs on the editor page in response to parsed edit intents.
 * Takes the current SiteSpec + an edit intent and returns a patched SiteSpec.
 */

import { agChatJson, MODELS } from "@/lib/antigravity";
import type { SiteSpec } from "@/lib/site-spec";
import { SiteSpecSchema } from "@/lib/site-spec";
import type { EditorIntent } from "@/agents/parser";
import { agImageGen } from "@/lib/antigravity";

const SYSTEM = `You are SitefyAI. You receive a SiteSpec JSON object and one edit instruction.

Your response MUST be the complete patched SiteSpec JSON. Start with { and end with }. No text before {. No text after }. No markdown. No fences. No explanation.

Rules:
1. Touch ONLY the field(s) the instruction names. Every other field: copy character-for-character — same wording, casing, order, whitespace.
2. If you change any English text field, update its Chinese counterpart to idiomatic ZH — not a literal word-for-word translation.
3. Never add, remove, or reorder sections unless the instruction explicitly says so.
4. Never improve, rephrase, or "fix" untouched fields. Never insert new facts, numbers, or claims.
5. If the instruction is ambiguous, apply the most conservative reading.
6. Output the full SiteSpec object — every section, every field, even untouched ones.`;

export async function applyEdit(spec: SiteSpec, intent: EditorIntent): Promise<SiteSpec> {
  if (intent.type === "edit_color") {
    // Color edits are deterministic — no LLM needed
    const patched: SiteSpec = {
      ...spec,
      theme: {
        ...spec.theme,
        [intent.target]: intent.hex,
      },
    };
    return SiteSpecSchema.parse(patched);
  }

  if (intent.type === "unknown") {
    return spec;
  }

  if (intent.type === "go_live") {
    return spec; // go_live is handled at the API route level, not here
  }

  // For edit_copy, change_template: ask the LLM
  const instruction =
    intent.type === "edit_copy"
      ? `Change the "${intent.field}" field in the "${intent.section}" section: ${intent.instruction}`
      : `Switch to template: ${intent.templateId}`;

  const patched = await agChatJson<unknown>({
    model: MODELS.worker,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: JSON.stringify({ spec, instruction }),
      },
    ],
    max_tokens: 2048,
    temperature: 0.2,
  });

  const valid = SiteSpecSchema.safeParse(patched);
  if (!valid.success) {
    throw new Error(`Editor returned invalid SiteSpec: ${valid.error.message}`);
  }
  return valid.data;
}

/** Regenerate a single section image via nanobanana2. */
export async function regenerateSectionImage(
  prompt: string,
  aspectRatio: "1:1" | "16:9" | "4:3" = "16:9"
): Promise<string> {
  const result = await agImageGen({ prompt, aspect_ratio: aspectRatio, format: "webp" });
  return result.url || result.dataUri || "";
}
