# SGSitefy — Architecture

**One-liner:** A SME plugs in their **UEN + a few photos + one sentence** about what they do, and SGSitefy auto-builds a live, bilingual (EN/中文) landing page — pre-filled from public business data, written by Claude, assembled by build agents, and published on a subdomain or custom domain.

The Ang Sheng build is **Template #1** + the reference implementation of the output.

---

## 1. Design principles

1. **Auto-fill first.** The SME's effort should be "upload photos + confirm." Everything else (legal name EN/中文, address, industry, incorporation year, hours, map, existing photos) is fetched from data they already have.
2. **Template-constrained AI.** Agents fill curated, conversion-optimised templates — they don't free-code from a blank page. This keeps output reliable, fast, and on-brand.
3. **Human-in-the-loop publish.** Nothing goes live about a real business until the owner reviews it (accuracy + liability).
4. **Compliance by default.** Use official/licensed data sources (ACRA via data.gov.sg, Google Places API, Facebook Graph API). No raw scraping of SGPBusiness / Companies.sg / Google / Facebook in production.
5. **Idempotent pipeline.** Each build step is cached and re-runnable; edits only re-run affected steps.

---

## 2. System overview

```
SME inputs ─▶ Enrichment (parallel) ─▶ Company Profile ─▶ Claude (Site Spec)
                                                              │
                                            Antigravity build agents ◀─ Template library
                                                              │
                                                   Render (Next.js) ─▶ Deploy (subdomain / custom domain)
```

**A. Client app — Onboarding Wizard + Tenant Dashboard**
Next.js (App Router) · TypeScript · Tailwind · shadcn/ui.
- Wizard: enter UEN → review prefilled data → upload/confirm photos → describe biz (or accept AI draft) → pick style → **Generate** → preview → **Publish**.
- Dashboard: edit content, manage domain, view analytics & leads, billing.

**B. API / Backend**
tRPC (typed end-to-end) on Node/TS · Auth.js or Clerk · org-scoped multi-tenancy (Org → Site(s)). Singpass-ready later for verified business identity.

**C. Enrichment connectors** (modular, each isolated + cached)
- **Registry** — ACRA entity data (legal name EN + 中文, SSIC industry, address, incorporation date, status) via **data.gov.sg / ACRA APIs**.
- **Google** — **Places API** (Place Details, Photos, hours, rating), coords for the Maps embed.
- **Facebook** — **Graph API** (Page about, photos, contact) via page auth; fallback to user-pasted info.
- **Image pipeline** — ingest uploads + pulled images → normalise, strip metadata, dedupe, auto-crop, store + CDN.

**D. AI generation layer**
- **Claude API = the strategist/copywriter/designer.** Reasons over the messy Company Profile + photos (vision) → emits a **Site Spec** (schema-constrained JSON via tool use): section list + order, headlines & body copy in brand voice (EN + 中文), photo→slot mapping, palette extracted from logo/photos, SEO meta + alt text, template choice.
- **Antigravity subagents = the front-end build crew.** Take the Site Spec + chosen Template → assemble React components, apply theme tokens, run responsive / a11y / Lighthouse QA, self-correct, output a preview build.
- **Template library** — curated landing templates (Ang Sheng = #1), each a set of slots + design tokens.

**E. Build & render** — Site Spec (content JSON) + Template → Next.js SSG/ISR site, per-tenant theming via design tokens.

**F. Hosting / delivery** — wildcard `{slug}.sgsitefy.com` + custom domains (CNAME + auto-SSL). CDN for assets, object storage for images.

**G. Platform** — Postgres + Prisma · job queue/orchestration (async pipeline takes minutes) · object storage (Cloudflare R2) + image CDN · Stripe billing · observability with **per-build token/cost tracking** · per-connector secrets.

---

## 3. The build pipeline (step by step)

| # | Step | Owner | Notes |
|---|------|-------|-------|
| 1 | **Intake** | Client | UEN, description, photos, optional FB/Google URLs |
| 2 | **Enrich (fan-out)** | Connectors | Registry + Google + Facebook + image proc, in parallel → **Company Profile** |
| 3 | **Plan** | Claude | Profile + photos (vision) → **Site Spec** (sections, EN/中文 copy, palette, SEO) |
| 4 | **Build** | Antigravity agents | Spec + Template → assemble UI, theme, responsive/a11y/QA → preview |
| 5 | **Review** | Client (+ Claude assist) | Inline edits ("make this punchier"), approve |
| 6 | **Publish** | Platform | Deploy → subdomain/custom domain, SSL, sitemap, analytics |
| 7 | **Iterate** | — | Edits re-run only affected steps |

Steps 2–4 run as **async jobs** behind the queue; the wizard shows live progress.

---

## 4. Data model (core entities)

- **User**, **Organization** (tenant), **Membership**
- **Company** — uen, name_en, name_zh, ssic_codes, address, incorporation_date, status, source_refs
- **Connection** — type (registry/google/facebook), tokens, raw_payload, fetched_at
- **Asset** — image, source, tags, dimensions, usage_slot
- **Site** — org_id, slug, custom_domain, template_id, theme_tokens, status
- **SiteSpec / ContentBlock** — versioned sections + bilingual content
- **Build** — status, logs, agent_runs, token_cost, preview_url
- **Domain** — hostname, dns_status, ssl_status
- **Subscription** — Stripe plan, usage

---

## 5. Claude vs Antigravity — the boundary

| | Claude API | Antigravity subagents |
|---|-----------|----------------------|
| Role | What the site **says & looks like** | Making it **real** (code/build) |
| Outputs | Site Spec JSON, copy (EN/中文), palette, SEO, photo mapping | Working components, theming, QA-passed preview build |
| Strengths used | Reasoning over messy data, vision, bilingual copy, schema-constrained tool use | Multi-file codegen, iterative self-correcting build + QA |
| Guardrail | Grounded only in provided/fetched data | Template-constrained, Lighthouse/a11y gates |

---

## 6. Tech stack (proposed)

- **Frontend / app:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- **API:** tRPC · **Auth:** Auth.js or Clerk
- **DB:** Postgres (Neon/Supabase) + Prisma
- **Queue / orchestration:** Inngest (or Temporal) for the async build pipeline
- **AI:** Anthropic Claude API (tool use + vision) for spec/copy; Antigravity agents for UI build
- **Storage / CDN:** Cloudflare R2 + Images (or Vercel Blob)
- **Hosting / domains:** Vercel or Cloudflare Pages; wildcard subdomains + custom-domain CNAME + auto-SSL
- **Billing:** Stripe · **Observability:** logs/traces + token-cost metering

*(This is the "T3-ish" path you asked about: Next.js + tRPC + Tailwind + Prisma + Postgres.)*

---

## 7. Multi-tenancy & domains

- Each Org gets one+ **Site** with a `slug` → served at `{slug}.sgsitefy.com` (wildcard DNS + wildcard TLS).
- **Custom domains:** SME points a CNAME → platform provisions SSL automatically (ACME).
- Sites are statically rendered per tenant (ISR for edits) → fast + cheap to host at scale.

---

## 8. Data sources — compliance notes (read before building)

- **ACRA / company data:** use **data.gov.sg** ACRA datasets / official ACRA APIs (Bizfile). **Do not scrape** SGPBusiness or Companies.sg — their ToS prohibit it; they are aggregators, not your licence to the data.
- **Google:** **Places API** (paid, ToS-compliant) for details/photos/hours. Don't scrape Maps.
- **Facebook:** **Graph API** with page authorisation + app review. Don't scrape pages.
- **PDPA (Singapore):** any personal data (contact names, etc.) must be handled per PDPA; get consent to pull & publish.
- **Image rights:** only publish images the SME owns or has rights to. Don't auto-publish Google/FB images without permission — confirm ownership at intake.

---

## 9. Roadmap

- **MVP** — UEN registry prefill + photo upload + Claude content + **one template** + EN/中文 + subdomain publish. Manual confirm steps. (Hold FB/Google integrations; start with Google Places only if budget allows.)
- **V2** — Google Places + Facebook Graph, multiple templates, custom domains, inline AI editing, analytics + lead capture.
- **V3** — Antigravity agents for bespoke (non-template) layouts, A/B testing, CRM/e-commerce add-ons, Singpass-verified "real business" badge.

---

## 10. Open decisions

- Hosting: Vercel (fastest) vs Cloudflare (cheaper at scale)?
- Orchestration: Inngest (simpler) vs Temporal (heavier, more control)?
- Do we store rendered HTML per tenant, or render on the fly via ISR?
- Pricing: per-site subscription vs one-time build + hosting tier?
- Name/domain: confirm `sgsitefy.com`/`.sg` + ACRA name availability.
