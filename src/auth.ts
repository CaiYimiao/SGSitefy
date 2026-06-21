import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";

/**
 * Auth.js v5 for SGSitefy.
 *
 * Free providers: Google + Facebook (OAuth). Users + accounts are persisted via
 * the Prisma adapter (any free Postgres — Neon / Supabase / Vercel Postgres).
 * Apple is intentionally omitted: it requires the paid Apple Developer Program.
 *
 * A "dev" email-only Credentials provider stays available locally (or when
 * ALLOW_DEV_LOGIN=true) so you can sign in before wiring OAuth credentials.
 *
 * Sessions are JWT (required by the Credentials provider and cheaper at the
 * edge); the adapter still records each user/OAuth account in the database, so
 * every user gets their own dedicated, queryable storage.
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

const providers = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }),
  Facebook({
    clientId: process.env.AUTH_FACEBOOK_ID,
    clientSecret: process.env.AUTH_FACEBOOK_SECRET,
  }),
  ...(allowDevLogin ? [devProvider] : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers,
  events: {
    // Fires when the adapter creates a brand-new user (first OAuth sign-in).
    async createUser({ user }) {
      if (user.id) await ensurePersonalOrg(user.id, user.name);
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = (user as { id: string }).id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) (session.user as { id?: string }).id = token.uid as string;
      return session;
    },
  },
});
