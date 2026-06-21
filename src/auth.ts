import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import authConfig from "@/auth.config";

/**
 * Auth.js v5 for SGSitefy — full (Node-runtime) config.
 *
 * Free providers: Google + Facebook (OAuth, defined in auth.config.ts). Users +
 * accounts are persisted via the Prisma adapter (any free Postgres — Neon /
 * Supabase / Vercel Postgres). Apple is intentionally omitted: it requires the
 * paid Apple Developer Program.
 *
 * A "dev" email-only Credentials provider stays available locally (or when
 * ALLOW_DEV_LOGIN=true) so you can sign in before wiring OAuth credentials.
 *
 * Sessions are JWT (required by the Credentials provider and cheaper at the
 * edge); the adapter still records each user/OAuth account in the database, so
 * every user gets their own dedicated, queryable storage.
 *
 * NOTE: the adapter + db + Credentials live ONLY here, never in auth.config.ts —
 * that keeps the middleware's edge bundle under the 1 MB limit.
 */

// Each user gets a personal Organization (their workspace) on first sign-in.
async function ensurePersonalOrg(userId: string, name?: string | null) {
  const existing = await db.membership.findFirst({ where: { userId } });
  if (existing) return;
  const org = await db.organization.create({
    data: { name: name ? `${name}'s workspace` : "My workspace" },
  });
  await db.membership.create({ data: { userId, orgId: org.id, role: "OWNER" } });
}

const allowDevLogin =
  process.env.ALLOW_DEV_LOGIN === "true" || process.env.NODE_ENV !== "production";

const devProvider = Credentials({
  name: "Dev email",
  credentials: {
    email: { label: "Email", type: "email" },
    name: { label: "Name", type: "text" },
  },
  authorize: async (creds) => {
    const email = String(creds?.email ?? "").trim().toLowerCase();
    if (!email) return null;
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name: creds?.name ? String(creds.name) : null },
    });
    await ensurePersonalOrg(user.id, user.name);
    return { id: user.id, email: user.email, name: user.name ?? undefined };
  },
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    ...(allowDevLogin ? [devProvider] : []),
  ],
  events: {
    // Fires when the adapter creates a brand-new user (first OAuth sign-in).
    async createUser({ user }) {
      if (user.id) await ensurePersonalOrg(user.id, user.name);
    },
  },
});
