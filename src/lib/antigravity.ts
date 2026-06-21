/**
 * Antigravity API client — raw fetch, Anthropic-compatible message surface.
 * All LLM calls in this project route through Antigravity; never call Anthropic directly.
 *
 * Set in .env.local:
 *   ANTIGRAVITY_BASE_URL=https://api.antigravity.ai   (or whatever endpoint they give you)
 *   ANTIGRAVITY_API_KEY=ag-...
 */

const BASE_URL = (process.env.ANTIGRAVITY_BASE_URL ?? "https://api.antigravity.ai").replace(/\/$/, "");
const API_KEY  = process.env.ANTIGRAVITY_API_KEY ?? "";

export const MODELS = {
  /**
   * Gemini 3.5 Flash — default free-tier text model on Antigravity Pro.
   * Use for: parser (intent routing), quick classifications.
   */
  flash: "gemini-3.5-flash",

  /**
   * Gemini 3 Pro — higher-quality text on Pro plan.
   * Use for: brand extraction, copy-fill, editor patches.
   */
  worker: "gemini-3-pro",

  /**
   * Claude Sonnet 4.5 — also available on Antigravity Pro.
   * Use for: complex bilingual copy that needs the best EN/ZH quality.
   */
  sonnet: "claude-sonnet-4-5",

  /**
   * nanobanana2 = Gemini 3.1 Flash Image — FREE on Pro plan.
   * Use for: service icons, thumbnails, anything at volume.
   */
  imageFlash: "nanobanana2",

  /**
   * Nano Banana Pro = gemini-3-pro-image-preview — ~$0.134/image.
   * Use for: hero image and logo (once per site — worth the quality).
   */
  imagePro: "gemini-3-pro-image-preview",
} as const;

export interface AGMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model: string;
  system?: string;
  messages: AGMessage[];
  max_tokens?: number;
  temperature?: number;
}

/** Single-turn chat — returns the assistant text. */
export async function agChat(opts: ChatOptions): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      system: opts.system,
      messages: opts.messages,
      max_tokens: opts.max_tokens ?? 1024,
      temperature: opts.temperature,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Antigravity ${res.status}: ${body}`);
  }

  const data = await res.json();
  const block = data?.content?.[0];
  if (block?.type === "text") return block.text as string;
  throw new Error(`Unexpected Antigravity response: ${JSON.stringify(data).slice(0, 200)}`);
}

/** Chat that returns parsed JSON. Strips markdown fences if present. */
export async function agChatJson<T>(opts: ChatOptions): Promise<T> {
  const raw = await agChat(opts);
  const stripped = raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? raw;
  return JSON.parse(stripped.trim()) as T;
}

export interface ImageGenOptions {
  prompt: string;
  /** "1:1" | "16:9" | "4:3" | "4:1" etc. Defaults to "1:1" */
  aspect_ratio?: string;
  /** Output format. Defaults to "png" */
  format?: "png" | "webp" | "jpeg";
  /**
   * Model override. Defaults to MODELS.imageFlash (nanobanana2, free on Pro).
   * Pass MODELS.imagePro for Nano Banana Pro (better quality, ~$0.134/img).
   */
  model?: string;
  /** thinking: "minimal" | "dynamic". Dynamic lets the model reason about composition first. */
  thinking?: "minimal" | "dynamic";
}

export interface ImageGenResult {
  url: string;
  /** base64 data URI when url is not available */
  dataUri?: string;
}

/** Generate an image via Antigravity's Nano Banana endpoint. */
export async function agImageGen(opts: ImageGenOptions): Promise<ImageGenResult> {
  const res = await fetch(`${BASE_URL}/v1/images/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      model: opts.model ?? MODELS.imageFlash,
      prompt: opts.prompt,
      aspect_ratio: opts.aspect_ratio ?? "1:1",
      format: opts.format ?? "png",
      thinking: opts.thinking ?? "minimal",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Antigravity image gen ${res.status}: ${body}`);
  }

  const data = await res.json();
  // Nano Banana returns { url } or { data: [{ url }] } or { data: [{ b64_json }] }
  const item = data?.data?.[0] ?? data;
  if (item?.url) return { url: item.url as string };
  if (item?.b64_json) return { url: "", dataUri: `data:image/png;base64,${item.b64_json}` };
  throw new Error(`Unexpected image gen response: ${JSON.stringify(data).slice(0, 200)}`);
}

// ── LOGO VISION ─────────────────────────────────────────────────────────────

export interface BrandColors {
  /** Primary brand color extracted from logo, as #RRGGBB */
  primary: string;
  /** Secondary / accent color */
  accent: string;
  /** Background / neutral tone if present */
  neutral: string;
  /** Raw personality adjectives inferred from the logo's visual style */
  personality: string[];
}

/**
 * Analyse an uploaded company logo with Gemini vision and extract brand colors.
 * Uses MODELS.worker (Gemini 3 Pro) which supports multimodal image input.
 * logoUrl can be a hosted URL or a base64 data URI.
 */
export async function extractBrandFromLogo(logoUrl: string): Promise<BrandColors> {
  const isDataUri = logoUrl.startsWith("data:");
  const imagePayload = isDataUri
    ? { type: "base64", media_type: "image/png", data: logoUrl.split(",")[1] }
    : { type: "url", url: logoUrl };

  const res = await fetch(`${BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELS.worker,
      max_tokens: 512,
      system:
        "You are a brand colour analyst. Look at the logo image and extract its colours and visual style. " +
        "Your response MUST be a single JSON object. Start your response with { and end with }. No text before {. No text after }. No markdown. No fences. " +
        "Required keys: " +
        "primary = the logo's dominant brand colour as 6-digit lowercase hex (e.g. #c23b22). " +
        "accent = the strongest secondary colour, or one complementary colour if the logo is single-colour, as 6-digit lowercase hex. " +
        "neutral = a near-white (#f7f4f0 range) or near-black (#141210 range) — whichever makes the primary readable as text on top. Never #ffffff or #000000. " +
        "personality = array of exactly 3 concrete visual adjectives (e.g. 'geometric', 'hand-stamped', 'industrial-bold') — never generic words like 'modern', 'clean', 'professional'. " +
        'Shape: {"primary":"#rrggbb","accent":"#rrggbb","neutral":"#rrggbb","personality":["adj","adj","adj"]}',
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: imagePayload,
            },
            {
              type: "text",
              text: "Extract brand colours and visual personality. Reply with the JSON object only.",
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Logo vision ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = (data?.content?.[0]?.text ?? "") as string;
  const stripped = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text;

  try {
    return JSON.parse(stripped.trim()) as BrandColors;
  } catch {
    // Graceful fallback — return neutral palette so the build doesn't fail
    return { primary: "#11264f", accent: "#f5b21a", neutral: "#f8f9fb", personality: ["professional"] };
  }
}
