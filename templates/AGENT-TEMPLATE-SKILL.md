# SGSitefy Template Skill — for Antigravity Build Agents

> **Load this file into the agent before generating or filling any template.**
> It exists for one reason: the default output of any LLM is *median* — the same
> purple-gradient, Inter-font, four-equal-cards page everyone else ships. This
> skill forces deliberate, on-brand, human-looking output and tells each agent
> exactly which Antigravity Pro model to use for each job.

These are **reference templates** consumed by the build crew (`src/agents/*`). They
are **not** rendered on the SGSitefy marketing site — they are the slot library the
copy-fill / image-gen / editor agents assemble a customer site from.

---

## 0. Zero-shot priming — read this first

Do it right on the first pass; there is no second prompt. Before writing a line:

1. **Commit to ONE explicit aesthetic** (editorial / warm-craft / brutalist-industrial / clinical-calm / premium-dark / heritage-classic / swiss-minimal / bold-maximalist / kinetic-modern). Median = failure.
2. **Lock 3-5 design tokens + a distinctive font pairing** (§1) before any markup.
3. **Fill only `data-slot` nodes; never invent structure** (§4).
4. **Ground every word** in the provided profile — no invented facts, numbers, certs, or clients.
5. **Bilingual EN + idiomatic 中文** on every text node; Chinese is rewritten, not literally translated.
6. **Self-check against §5** before you finish.

**Quick do / don't**

| ✅ Do | ❌ Don't |
|---|---|
| Distinctive font pair (Fraunces+Public Sans…) | Inter / Roboto / Poppins / Space Grotesk |
| Off-black `#14110f` on off-white `#faf7f2` | Pure `#000` on `#fff` |
| Logo-derived palette | Purple→indigo gradient |
| Asymmetric splits, one signature move | 4 equal cards, dead-centre everything |
| Concrete copy ("laser-cut 6mm steel") | "unlock / elevate / seamless / world-class" |
| Real focus states + reduced-motion | Decorative carousels, linear hovers |

---

## 1. The "less AI-generated" rulebook (hard constraints)

AI sites are recognisable across the room. Ban the tells:

**Typography — banned defaults:** Inter, Roboto, Arial, Poppins, Space Grotesk, Montserrat.
- Use a **distinctive pairing per template** (display + text), e.g. Archivo + Source Serif, Fraunces + Public Sans, Space Mono + IBM Plex Sans, Bricolage Grotesque + Newsreader.
- One display face for headings, one quiet text face for body. Never one font for everything.
- Set a real type scale (e.g. 1.250 major-third or 1.333 perfect-fourth), not arbitrary px.

**Colour — banned defaults:** purple→indigo gradients, `#6366f1`/violet hero washes, pure-black on pure-white.
- Each template ships a **3–5 token palette** (`--ink`, `--bg`, `--surface`, `--brand`, `--accent`) drawn from the industry, not a rainbow. Off-blacks (`#14110f`) and off-whites (`#faf7f2`) read more human than `#000`/`#fff`.
- Colour comes from the customer's **logo** (extract with vision — see §3), not an invented gradient.

**Layout — banned defaults:** 4 equal cards in a row, dead-centre everything, identical section rhythm, decorative carousels, "stacked-card app UI" on a marketing page.
- Vary section rhythm: alternate full-bleed / boxed, asymmetric splits (60/40, 7/5), offset images, generous *uneven* whitespace.
- Give one section a signature move (overlapping image, oversized numeral, sticky side-rail) so the page has a memory hook.

**Micro-details that separate pro from junior:** real focus states, hover transitions with easing (not linear), optical alignment, hanging punctuation, tightened display tracking, a faint grain/texture instead of flat fills.

**Pick an explicit aesthetic per template** (editorial, warm-craft, brutalist-industrial, clinical-calm, premium-dark) and commit — median = death.

---

## 1b. Brand craft — the hand-made signal

Bespoke/MNC sites read as "made by hand" not because of more effects, but because a
human made deliberate decisions and then exercised **restraint**. Templated sites pour
content into fixed boxes; hand-made sites bend the layout to the content. Distilled, the
craft is a finite set of moves — apply them and the output stops looking generated.
(Synthesised from custom-vs-template and premium-brand design analysis — see Sources in chat.)

**The twelve craft signals** (do these; they are the difference):

1. **Content-led, not box-led.** Design the section around the actual copy/photo you have, not a fixed card grid. If there are 3 services, lay out 3 — don't force a 4-up grid. Boxes are the #1 template tell.
2. **A real typographic system, not a font choice.** One distinctive display face + one quiet text face, a true modular scale (1.25/1.333), deliberate tracking (tighten big headings, letterspace small uppercase eyebrows), generous leading, hanging punctuation, mixed weights for hierarchy. Type *is* the brand.
3. **Art direction over stock.** One consistent photo treatment across the whole site — a single colour grade, one crop logic, optional duotone/grain — so images feel shot *for* this brand. Add captions/credits. Random-looking stock is an instant tell.
4. **A visible grid + intentional, uneven whitespace.** Columns, consistent margins, baseline rhythm; align optically, not just snapped. Whitespace is a material, not leftover space — luxury reads as breathing room.
5. **One signature motif, threaded throughout.** A single recurring device — a hairline rule, oversized index numerals, a brand shape, a custom bullet, a sticky side-rail — repeated across sections. This is the memory hook and the thing competitors can't copy.
6. **Restrained, meaningful motion.** Micro-feedback that *means* something (a hover that previews, a quiet eased reveal on scroll). Never decorative carousels or parallax-for-its-own-sake. Always honour \`prefers-reduced-motion\`.
7. **The unglamorous craft.** Real focus rings, true loading/empty/error states, one consistent corner-radius scale, shadows that obey a single light source, pixel-snapped borders, ≥4.5:1 contrast. Polish in the boring parts is what separates pro from junior.
8. **Restraint & confidence.** Few colours, few fonts, lots of air, one idea per section. Saying *less*, larger, beats saying more. When in doubt, remove.
9. **Editorial voice in the copy.** Headlines with a point of view; captions and microcopy that carry personality; specifics over adjectives. The words are part of the UI — generic copy makes great layout look templated.
10. **Narrative section rhythm.** Vary density and structure down the page — full-bleed hero → boxed proof → editorial split → quiet CTA — so it reads like a story, not stacked identical blocks.
11. **Deliberate human imperfection.** A touch of intentional asymmetry, an off-grid element, a hand-set headline break — signals a person decided, not a generator.
12. **Considered edges.** A footer that's composed (not a link dump), a thoughtful empty/404/loading state, a sensible favicon/OG. Brands sweat the parts users barely notice.

**Distinction guarantee (so no two customers look like siblings):** for each build, vary
**(a)** the aesthetic, **(b)** the type pairing, **(c)** the palette (logo-derived),
**(d)** the signature motif, and **(e)** the grid/section rhythm. If two outputs share 3+
of these, push them apart. Proprietary feel = a unique combination per business, not a
reskin of one template.

**Per-industry craft briefs (load the matching one before you build/fill):**
`templates/craft/<industry>.md` — `industrial` · `fnb` · `retail` · `wellness` ·
`services`. Each takes these rules down to trade-specific type, palette, art direction,
layout archetype, signature motifs, copy voice (EN + 中文), trust signals, and a
kill-list of that trade's template tells. They are the niche edge — always read the
brief for the customer's industry first.

> Rule of thumb: a templated site is *decorated*; a hand-made site is *composed*.
> Compose — make every section a decision, then cut what doesn't earn its place.

---

## 2. Template kinds & required structure

Three kinds, each with a fixed contract so agents and the renderer agree:

### `onepage` — single scrolling page, anchor nav
Sections (in order): sticky nav (smooth-scroll anchors) → hero → trust strip → about → services/offer → social proof → CTA band → contact → footer. One HTML file.

### `multipage` — shared shell, 4–6 pages
`index.html` + `about.html` + `services.html` (or menu/products/treatments) + `contact.html` (+ optional `certifications.html`). **Shared `styles.css` + `app.js`**, identical nav/footer across pages, `aria-current` on the active link. Every page is independently fillable.

### `showcase` — image-forward / editorial
Visual-led: full-bleed hero, large asymmetric gallery (CSS columns / grid spans), big type, minimal copy. For trades that sell on look (F&B, retail, aesthetics, design).

**Every template, every kind, must:**
- Be **bilingual EN/中文** — every text node carries `data-en` + `data-zh`; a `toggleLang()` swaps text and flips `<html lang>`; nested-HTML nodes use `data-rich` + innerHTML swap.
- Be **responsive** (hamburger nav < 760px) and **a11y-clean** (landmarks, alt text, heading order, ≥4.5:1 contrast, visible focus).
- End the footer with `Built with SGSitefy`.
- Carry the **slot contract** in §4 so agents fill, not free-code.

---

## 3. Antigravity Pro model routing (use the right model per job)

| Job | Model (`MODELS.*`) | Why |
|---|---|---|
| Intent routing / classify | `flash` (gemini-3.5-flash) | sub-100ms, free-tier, throwaway |
| Brand decision, copy-fill, editor patches | `worker` (gemini-3-pro) | strong reasoning, multimodal, JSON |
| **Bilingual EN/中文 hero & body copy** | `sonnet` (claude-sonnet-4-5) | best 中文 nuance — don't cheap out on the words a human reads first |
| Logo colour + photo→slot vision | `worker` (gemini-3-pro) | multimodal image input |
| Service icons, thumbnails (volume) | `imageFlash` (nanobanana2) | **free on Pro**, generate many |
| **Hero photo + logo (once per site)** | `imagePro` (Nano Banana Pro / gemini-3-pro-image-preview) | 4K photoreal, texture/lighting, worth the ~$0.13 |

**Leverage what Pro unlocks:**
- **Nano Banana Pro takes up to 14 reference images** → feed the customer's real photos so generated hero/filler images match *their* space, palette, and lighting (kills the stock-photo look).
- **Conversational editing** → the editor agent refines one region ("warmer light, lower angle") instead of regenerating.
- **Vision photo→slot** → don't place photos by index; let `worker` read each photo and map it to the slot it actually fits (workshop shot → about, plated dish → menu hero).
- Spend `sonnet` tokens only on the copy a human reads; assemble everything else deterministically (the existing `assembleSiteSpec` pattern) to keep cost down.

### Image prompting (non-AI-looking photography)
Structure: `[subject + adjectives] doing [action] in [location/context], [composition / camera angle], [lighting / atmosphere], [style / medium]`.
- Demand a real camera language: low-angle, 35mm, shallow DOF, available window light, slight motion.
- Forbid: glossy stock clichés (handshake, laptop-and-coffee), centred symmetry, plastic skin, watermark-feel.
- Always pass the **brand hex** as a colour-grade directive and the **industry vibe** (not "food" but "wok-hei zi char, steam, char").

---

## 4. The slot contract (so agents fill, never free-code)

Each template is a set of **named slots** with explicit limits. Agents emit only the
small `TemplateContent` payload (see `src/lib/templates.ts`); the renderer assembles
the rest. Mark slots in HTML with `data-slot`:

```html
<h1 data-slot="hero.headline" data-en="…" data-zh="…">…</h1>
<div data-slot="services" data-min="3" data-max="6">…</div>
<img data-slot="gallery.0" data-en-alt="…" />
```

Rules for the fill agent:
- **Ground every claim** in the company profile — never invent certs, figures, client names.
- Respect `data-min`/`data-max` counts; write exactly that many.
- Fill **both** `en` and `zh`; 中文 must read natively (run the bilingual-QA pass).
- Touch only `data-slot` nodes — structure, tokens, and layout are locked.

Each template folder carries a `template.json` (machine-readable spec):
```json
{
  "id": "industrial-onepage-forge",
  "industry": "industrial",
  "kind": "onepage",
  "aesthetic": "brutalist-industrial",
  "fonts": { "display": "Archivo", "text": "IBM Plex Sans" },
  "tokens": { "ink": "#14110f", "bg": "#faf7f2", "brand": "#b3541e", "accent": "#1f6f6b" },
  "sections": ["hero","trust","about","services","work","cta","contact"],
  "serviceCount": 6,
  "entry": "index.html"
}
```
A top-level `manifest.json` lists every template so an agent can query by
`{industry, kind, aesthetic}` and pick — this is the "skill library" surface.

---

## 5. Verification loop (before a template is accepted)

1. **Tell-scan** — none of the §1 banned defaults present (grep the CSS for `Inter`, `#6366f1`, `repeat(4,1fr)` symmetry, purple gradients).
2. **A11y** — landmarks, alt text, heading order, contrast ≥4.5:1, visible focus, `prefers-reduced-motion` honoured.
3. **Bilingual** — every visible node has `data-en`+`data-zh`; toggle flips cleanly; 中文 not machine-stiff.
4. **Responsive** — render at 390 / 768 / 1280; hamburger works; no overflow.
5. **Distinctiveness** — would a designer guess two of our templates came from the same generator? If yes, push the aesthetics further apart.

> The point of constraints isn't to slow the agent down — it's to stop it
> defaulting to the median. A loaded skill file + a token palette + an explicit
> aesthetic is the difference between "obviously AI" and "who designed this?".
