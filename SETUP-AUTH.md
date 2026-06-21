# Auth setup — Google + Facebook (free)

This wires sign-in for the owner dashboard. Public trial pages
(`sgsitefy.com/theirsite` → `/s/[slug]`) stay open to everyone; auth only gates
`/dashboard`, `/new`, `/editor`. **Apple is intentionally left out — it needs the
paid Apple Developer Program ($99/yr).**

Everything below is **free** and takes ~15 minutes. You paste the secrets into
`.env.local`; the code only reads them from the environment.

---

## 0. Install + generate

```bash
npm install                 # picks up @auth/prisma-adapter
cp .env.example .env.local
npx auth secret             # writes AUTH_SECRET into .env.local
```

## 1. Database — Neon (free Postgres)

1. Go to **neon.tech**, sign up (free, no card).
2. **New Project** → pick a region near Singapore.
3. Copy the **connection string** (looks like `postgresql://...@...neon.tech/neondb?sslmode=require`).
4. Paste it as `DATABASE_URL` in `.env.local`.
5. Create the tables:
   ```bash
   npx prisma migrate dev --name auth
   # (or, no migration history yet:  npx prisma db push)
   ```

> Vercel Postgres or Supabase work identically — same `DATABASE_URL`, same Prisma.

## 2. Google OAuth (free)

1. **console.cloud.google.com** → create/select a project.
2. **APIs & Services → OAuth consent screen** → External → fill app name + your email → save (Testing mode is fine for the trial).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → Application type **Web application**.
4. **Authorized redirect URIs** — add:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-DOMAIN/api/auth/callback/google` (when you deploy)
5. Copy **Client ID** → `AUTH_GOOGLE_ID`, **Client secret** → `AUTH_GOOGLE_SECRET`.

## 3. Facebook Login (free)

1. **developers.facebook.com** → My Apps → **Create App** → use case **Authenticate and request data with Facebook Login** (Consumer).
2. Add the **Facebook Login** product.
3. **Facebook Login → Settings → Valid OAuth Redirect URIs** — add:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://YOUR-DOMAIN/api/auth/callback/facebook`
4. **App settings → Basic** — copy **App ID** → `AUTH_FACEBOOK_ID`, **App secret** → `AUTH_FACEBOOK_SECRET`.
5. Keep the app in **Development** mode for the trial (you + test users can log in). Submit for review only when you go public.

> Facebook requires your site to be served over **https** in production (localhost is exempted).

## 4. Run

```bash
npm run dev
# visit http://localhost:3000/signin → Continue with Google / Facebook
```

A personal workspace (Organization + OWNER membership) is created automatically on
first sign-in, so each user immediately has their own dedicated storage for sites.

---

## Notes

- **Dev sign-in:** the email-only dev login stays available locally. To enable it
  on a deployed preview, set `ALLOW_DEV_LOGIN=true` **and**
  `NEXT_PUBLIC_ALLOW_DEV_LOGIN=true`. Leave both `false` in production.
- **Env var names** follow the Auth.js v5 convention (`AUTH_GOOGLE_ID` etc.), so the
  providers pick them up automatically.
- **Nothing here costs money.** The only paid path is Apple, which is excluded.
