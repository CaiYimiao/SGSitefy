// Regenerates manifest.json by scanning the per-template template.json specs.
// Run from templates/library:  node _build-manifest.js
const fs = require("fs"), path = require("path");
const inds = ["industrial", "fnb", "retail", "wellness", "services"];
const out = [];
for (const ind of inds) {
  if (!fs.existsSync(ind)) continue;
  for (const id of fs.readdirSync(ind)) {
    const dir = path.join(ind, id);
    if (!fs.statSync(dir).isDirectory()) continue;
    const tj = path.join(dir, "template.json");
    if (!fs.existsSync(tj)) continue;
    let spec = {};
    try { spec = JSON.parse(fs.readFileSync(tj, "utf8")); } catch (e) { spec = { parseError: true }; }
    const htmls = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort();
    const hasIndex = htmls.includes("index.html");
    let status = "complete";
    if (!hasIndex) status = "spec-only";
    else if (spec.kind === "multipage" && htmls.length < 3) status = "partial";
    out.push({
      id: spec.id || id,
      industry: ind,
      kind: spec.kind || null,
      aesthetic: spec.aesthetic || null,
      fonts: spec.fonts || null,
      tokens: spec.tokens || null,
      sections: spec.sections || null,
      serviceCount: spec.serviceCount || null,
      path: dir.split(path.sep).join("/") + "/" + (spec.entry || "index.html"),
      pages: htmls,
      status,
    });
  }
}
out.sort((a, b) => (a.industry + a.kind + a.id).localeCompare(b.industry + b.kind + b.id));
const manifest = {
  name: "SGSitefy agent template library",
  note: "Reference templates consumed by Antigravity build agents (not shown on the marketing site). Query by {industry, kind, aesthetic}. See AGENT-TEMPLATE-SKILL.md for the slot contract and model routing.",
  kinds: ["onepage", "multipage", "showcase"],
  industries: inds,
  generated: new Date().toISOString().slice(0, 10),
  count: out.length,
  templates: out,
};
fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));
const byStatus = out.reduce((a, t) => { a[t.status] = (a[t.status] || 0) + 1; return a; }, {});
console.log("manifest.json written:", out.length, "templates");
console.log("status:", JSON.stringify(byStatus));
