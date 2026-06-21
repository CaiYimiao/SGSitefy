import type { CompanyProfile } from "@/types/company-profile";

export type ImportResult = Partial<CompanyProfile> & { photos?: { id: string; url: string }[] };

/**
 * Best-effort enrichment from a URL the SME OWNS (their website / Google /
 * Facebook page). Reads public page data — OpenGraph meta, schema.org JSON-LD,
 * and images — with no API key. This is a convenience importer, not a scraper
 * farm: login-walled content (full Facebook, SGPBusiness) won't come through,
 * and the owner confirms everything before publish. For robust, ToS-compliant
 * data at scale, use the Google Places / Facebook Graph connectors instead.
 */
export async function importFromUrl(rawUrl: string): Promise<ImportResult> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; SGSitefyBot/1.0; +https://sgsitefy.com)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Could not fetch that link (HTTP ${res.status}).`);
  const html = await res.text();

  const out: ImportResult = { source: "manual" };
  const photos = new Set<string>();

  const meta = (prop: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"))?.[1];

  const title = meta("og:title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (title) out.nameEn = decode(title.trim());
  const desc = meta("og:description");
  const ogImg = meta("og:image");
  if (ogImg) addPhoto(photos, url, ogImg);

  // schema.org JSON-LD — the richest source when present
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const raw = JSON.parse(m[1].trim());
      const nodes = flattenLd(raw);
      for (const n of nodes) {
        const type = String(n["@type"] ?? "");
        if (!/Organization|LocalBusiness|Store|Restaurant|Corporation/i.test(type) && !n.telephone && !n.address) continue;
        if (n.name && !out.nameEn) out.nameEn = String(n.name);
        if (n.telephone && !out.phone) out.phone = String(n.telephone);
        if (n.email && !out.email) out.email = String(n.email);
        if (n.address && !out.address) {
          const a = n.address;
          out.address = typeof a === "string" ? a : [a.streetAddress, a.addressLocality, a.postalCode].filter(Boolean).join(", ");
        }
        if (n.geo) {
          out.lat = Number(n.geo.latitude) || out.lat;
          out.lng = Number(n.geo.longitude) || out.lng;
        }
        const imgs = Array.isArray(n.image) ? n.image : n.image ? [n.image] : [];
        for (const im of imgs) addPhoto(photos, url, typeof im === "string" ? im : im?.url);
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  }

  // fall back to a few page images
  if (photos.size < 4) {
    for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      const abs = toAbs(url, m[1]);
      if (abs && /\.(jpe?g|png|webp)(\?|$)/i.test(abs)) photos.add(abs);
      if (photos.size >= 8) break;
    }
  }

  out.photos = [...photos].slice(0, 8).map((u, i) => ({ id: `imp${i + 1}`, url: u }));
  if (desc && !out.nameEn) out.nameEn = decode(desc.slice(0, 60));
  return out;
}

function flattenLd(raw: unknown): Record<string, any>[] {
  const arr = Array.isArray(raw) ? raw : [raw];
  const out: Record<string, any>[] = [];
  for (const item of arr) {
    if (item && typeof item === "object") {
      out.push(item as Record<string, any>);
      const graph = (item as Record<string, any>)["@graph"];
      if (Array.isArray(graph)) out.push(...graph);
    }
  }
  return out;
}

function toAbs(base: string, src: string): string | null {
  try {
    return new URL(src, base).toString();
  } catch {
    return null;
  }
}

function addPhoto(set: Set<string>, base: string, src?: string) {
  if (!src) return;
  const abs = toAbs(base, src);
  if (abs) set.add(abs);
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}
