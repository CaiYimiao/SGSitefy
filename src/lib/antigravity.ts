/**
 * AI client — Google AI Studio (OpenAI-compatible endpoint).
 *
 * Set in .env.local / Vercel:
 *   ANTIGRAVITY_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
 *   ANTIGRAVITY_API_KEY=your-google-ai-studio-key
 */

const BASE_URL = (
  process.env.ANTIGRAVITY_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai"
).replace(/\/$/, "");
const API_KEY = process.env.ANTIGRAVITY_API_KEY ?? "";

export const MODELS = {
  /** Gemini 2.5 Flash — fast + cheap. Use for: parser, intent routing. */
  flash: "gemini-2.5-flash",

  /** Gemini 2.5 Pro — high quality. Use for: brand extraction, editor patches. */
  worker: "gemini-2.5-pro",

  /** Gemini 2.5 Pro — bilingual copy (EN/ZH). Replaces claude-sonnet-4-5. */
  sonnet: "gemini-2.5-pro",

  /** Gemini image generation — service icons + hero images. */
  imageFlash: "gemini-2.0-flash-preview-image-generation",

  /** Gemini image generation Pro quality — hero/logo (once per site). */
  imagePro: "gemini-2.0-flash-preview-image-generation",
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
  const messages = [
    ...(opts.system ? [{ role: "system", content: opts.system }] : []),
    ...opts.messages,
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      max_tokens: opts.max_tokens ?? 1024,
      temperature: opts.temperature,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`AI ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text === "string") return text;
  throw new Error(`Unexpected AI response: ${JSON.stringify(data).slice(0, 200)}`);
}

/** Chat that returns parsed JSON. Strips markdown fences if present. */
export async function agChatJson<T>(opts: ChatOptions): Promise<T> {
  const raw = await agChat(opts);
  const stripped = raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? raw;
  return JSON.parse(stripped.trim()) as T;
}

export interface ImageGenOptions {
  prompt: string;
  aspect_ratio?: string;
  format?: "png" | "webp" | "jpeg";
  model?: string;
  thinking?: "minimal" | "dynamic";
}

export interface ImageGenResult {
  url: string;
  dataUri?: string;
}

/** Generate an image via Gemini image generation API. */
export async function agImageGen(opts: ImageGenOptions): Promise<ImageGenResult> {
  const imageBase = process.env.ANTIGRAVITY_BASE_URL
    ?.replace("/v1beta/openai", "") ?? "https://generativelanguage.googleapis.com";

  const model = opts.model ?? MODELS.imageFlash;

  const res = await fetch(
    `${imageBase}/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    // Graceful fallback — return a placeholder so the build doesn't fail
    console.warn(`Image gen failed (${res.status}): ${body} — using placeholder`);
    return { url: `https://picsum.photos/seed/${encodeURIComponent(opts.prompt.slice(0, 20))}/1200/800` };
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType ?? "image/png";
      return { url: "", dataUri: `data:${mime};base64,${part.inlineData.data}` };
    }
  }

  // Fallback if no image returned
  return { url: `https://picsum.photos/seed/${encodeURIComponent(opts.prompt.slice(0, 20))}/1200/800` };
}

// ── LOGO VISION ─────────────────────────────────────────────────────────────

export interface BrandColors {
  primary: string;
  accent: string;
  neutral: string;
  personality: string[];
}

/** Analyse a company logo with Gemini vision and extract brand colors. */
export async function extractBrandFromLogo(logoUrl: string): Promise<BrandColors> {
  const isDataUri = logoUrl.startsWith("data:");

  const imageContent = isDataUri
    ? { type: "image_url", image_url: { url: logoUrl } }
    : { type: "image_url", image_url: { url: logoUrl } };

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODELS.worker,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "You are a brand colour analyst. Look at the logo image and extract its colours and visual style. " +
            "Your response MUST be a single JSON object. Start your response with { and end with }. No text before {. No text after }. No markdown. No fences. " +
            "Required keys: " +
            "primary = the logo's dominant brand colour as 6-digit lowercase hex (e.g. #c23b22). " +
            "accent = the strongest secondary colour, or one complementary colour if the logo is single-colour, as 6-digit lowercase hex. " +
            "neutral = a near-white (#f7f4f0 range) or near-black (#141210 range) — whichever makes the primary readable as text on top. Never #ffffff or #000000. " +
            "personality = array of exactly 3 concrete visual adjectives (e.g. 'geometric', 'hand-stamped', 'industrial-bold') — never generic words like 'modern', 'clean', 'professional'. " +
            'Shape: {"primary":"#rrggbb","accent":"#rrggbb","neutral":"#rrggbb","personality":["adj","adj","adj"]}',
        },
        {
          role: "user",
          content: [
            imageContent,
            { type: "text", text: "Extract brand colours and visual personality. Reply with the JSON object only." },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    return { primary: "#11264f", accent: "#f5b21a", neutral: "#f8f9fb", personality: ["professional"] };
  }

  const data = await res.json();
  const text = (data?.choices?.[0]?.message?.content ?? "") as string;
  const stripped = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text;

  try {
    return JSON.parse(stripped.trim()) as BrandColors;
  } catch {
    return { primary: "#11264f", accent: "#f5b21a", neutral: "#f8f9fb", personality: ["professional"] };
  }
}
