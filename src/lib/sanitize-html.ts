import * as cheerio from "cheerio";

/**
 * Sanitise AI-generated HTML before injecting it into a published page.
 *
 * The bespoke-gen agent returns markup we did NOT write, so we treat it as
 * untrusted: strip anything that can execute (scripts, event handlers,
 * javascript: URLs, embedded frames/objects) while keeping the structural and
 * styling markup we actually want (headings, paragraphs, divs, inline styles,
 * classes, images, links, SVG).
 */

// Tags removed entirely (with their contents)
const FORBIDDEN_TAGS = ["script", "iframe", "object", "embed", "noscript", "template", "link", "meta", "base"];

// Attributes stripped from every element
const isEventAttr = (name: string) => /^on/i.test(name);
const isDangerUrl = (val: string) => /^\s*(javascript|data|vbscript):/i.test(val);

export function sanitizeHtml(dirty: string): string {
  if (!dirty || !dirty.trim()) return "";

  const $ = cheerio.load(dirty, null, false);

  // Drop forbidden tags
  $(FORBIDDEN_TAGS.join(",")).remove();

  // Walk every element and clean attributes
  $("*").each((_, node) => {
    if (node.type !== "tag") return;
    const el = $(node);
    const attribs = { ...(node.attribs ?? {}) };
    for (const [name, value] of Object.entries(attribs)) {
      // event handlers: onclick, onload, etc.
      if (isEventAttr(name)) { el.removeAttr(name); continue; }
      // href/src/xlink:href with javascript:/data:/vbscript:
      if (/^(href|src|xlink:href|formaction|action)$/i.test(name) && isDangerUrl(value)) {
        el.removeAttr(name);
        continue;
      }
      // style with expression()/url(javascript:) — rare but strip it
      if (name.toLowerCase() === "style" && /(expression\(|javascript:)/i.test(value)) {
        el.removeAttr(name);
      }
    }
  });

  return $.html();
}
