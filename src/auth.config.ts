import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

/**
 * Edge-safe auth config — NO Prisma adapter, NO db imports.
 *
 * This is what the middleware loads, so it must stay light enough to fit the
 * Edge runtime's 1 MB bundle limit. Only OAuth provider configs (pure objects)
 * and pure callback functions live here. The heavy pieces — the Prisma adapter,
 * the db client, and the db-backed Credentials provider — are added in auth.ts,
 * which runs only in the Node runtime (API routes).
 */
export default {
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  ],
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
} satisfies NextAuthConfig;
