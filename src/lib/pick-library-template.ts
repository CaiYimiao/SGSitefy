import fs from "fs";
import path from "path";

export interface LibraryTemplate {
  id: string;
  industry: string;
  kind: string;
  aesthetic: string;
  fonts: Record<string, string>;
  tokens: Record<string, string>;
  sections: string[];
  serviceCount: number;
  entry: string;
  status?: string;
}

const MANIFEST_PATH = path.join(process.cwd(), "templates/library/manifest.json");

function getManifest(): LibraryTemplate[] {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  return (JSON.parse(raw).templates ?? []) as LibraryTemplate[];
}

/**
 * Pick one library template for a given industry.
 * Preference order: aesthetic match → kind match → first complete → services fallback.
 */
export function pickLibraryTemplate(
  industry: string,
  opts: { kind?: string; aesthetic?: string } = {}
): { template: LibraryTemplate; htmlPath: string; dir: string } {
  const manifest = getManifest();
  const complete = manifest.filter((t) => !t.status || t.status === "complete");
  const candidates = complete.filter((t) => t.industry === industry);

  let chosen: LibraryTemplate | undefined;
  if (opts.aesthetic) chosen = candidates.find((t) => t.aesthetic === opts.aesthetic);
  if (!chosen && opts.kind) chosen = candidates.find((t) => t.kind === opts.kind);
  if (!chosen) chosen = candidates[0];
  // Final fallback — services-onepage
  if (!chosen) chosen = complete.find((t) => t.industry === "services" && t.kind === "onepage");
  if (!chosen) chosen = complete[0];

  const dir = path.join(process.cwd(), "templates/library", chosen.industry, chosen.id);
  const htmlPath = path.join(dir, chosen.entry ?? "index.html");
  return { template: chosen, htmlPath, dir };
}

/** Resolve dir + htmlPath for an already-chosen template id (used at render time). */
export function resolveLibraryTemplate(templateId: string): {
  template: LibraryTemplate;
  htmlPath: string;
  dir: string;
} {
  const manifest = getManifest();
  const t = manifest.find((m) => m.id === templateId);
  if (!t) throw new Error(`Library template not found: ${templateId}`);
  const dir = path.join(process.cwd(), "templates/library", t.industry, t.id);
  return { template: t, htmlPath: path.join(dir, t.entry ?? "index.html"), dir };
}
