import fs from "fs";
import path from "path";

/**
 * Serves the hand-built static legal page (terms.html) at /terms, rewriting its
 * internal links to the app's routes. A Route Handler is the correct way to
 * return a raw HTML document (a page.tsx can't be prerendered as a Response).
 */
export const dynamic = "force-static";

export function GET() {
  const file = path.join(process.cwd(), "terms.html");
  let html = fs.readFileSync(file, "utf-8");
  html = html
    .replace(/href="preview\.html#/g, 'href="/#')
    .replace(/href="preview\.html"/g, 'href="/"')
    .replace(/href="terms\.html"/g, 'href="/terms"');
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
