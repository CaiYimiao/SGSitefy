# SGSitefy

AI website builder for Singapore SMEs. Enter a **UEN + a few photos + one sentence**, and SGSitefy
prefills your details from public business data, has Claude write your bilingual (EN/中文) copy and
lay out the page, and publishes a live landing site.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind** + **shadcn/ui** — deploys on **Vercel**
- **Postgres** (Vercel Postgres / Neon / Supabase) via **Prisma**
- **Anthropic Claude API** — emits the strict `SiteSpec` (sections, copy, theme, SEO) via tool use
- *(planned)* Inngest jobs, Vercel Blob storage, Google Places + Facebook Graph connectors, Antigravity build agents

## Getting started

```bash
cp .env.example .env        # fill ANTHROPIC_API_KEY (DATABASE_URL optional for the demo flow)
npm install
npx prisma generate         # (npx prisma db push once DATABASE_URL is set)
npm run dev                 # http://localhost:3000  →  /new for the wizard
```

The wizard works end-to-end with just `ANTHROPIC_API_KEY`: UEN lookup returns a shell when no
`ACRA_RESOURCE_ID` is set, you fill details + photos + a description, and the **Generate** step calls
Claude to produce a real `SiteSpec` that's previewed bilingually.

## Project layout

```
src/
  app/
    page.tsx                  marketing home → /new
    new/page.tsx              hosts the onboarding wizard
    api/uen/route.ts          ACRA lookup (data.gov.sg)
    api/generate/route.ts     Claude → SiteSpec
  components/
    onboarding-wizard.tsx     5-step wizard + live SiteSpec preview
    ui/                       shadcn components
  lib/
    site-spec.ts              ★ the SiteSpec contract (zod + JSON schema for the tool)
    anthropic.ts              Claude "strategist" — generateSiteSpec()
    acra.ts                   registry connector
    db.ts                     Prisma client
  types/company-profile.ts    merged enriched company view
prisma/schema.prisma          data model
```

## What's real vs stubbed (MVP)

- ✅ Wizard, SiteSpec contract, Claude generation, bilingual preview, data model
- 🔜 Photo uploads (currently URL paste), Google Places / Facebook import, Antigravity agent build,
  per-tenant publish to `{slug}.sgsitefy.com`, Inngest job pipeline

## Deploy (Vercel)

1. Push to GitHub → import into Vercel.
2. Add a Postgres store (Vercel Postgres) and set `DATABASE_URL`, plus `ANTHROPIC_API_KEY`.
3. `prisma generate` runs on build (add to the build command or a `postinstall`).

## Compliance (important)

Use **official data sources** — ACRA via **data.gov.sg**, **Google Places API**, **Facebook Graph
API**. Do **not** scrape SGPBusiness / Companies.sg / Google / Facebook (ToS). Handle personal data
per **PDPA**, and only publish images the SME owns.
