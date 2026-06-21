import NextAuth from "next-auth";
import authConfig from "@/auth.config";

/**
 * Gate the owner-only areas behind sign-in. Everything else — the marketing
 * site, the public trial pages at /s/[slug] (sgsitefy.com/theirsite), the
 * /api/auth routes — stays open.
 *
 * Uses the edge-light auth.config (no Prisma adapter / db) so the middleware
 * bundle stays under the Edge runtime's 1 MB limit. The JWT cookie is verified
 * with just the secret — no database round-trip needed here.
 */
const { auth } = NextAuth(authConfig);

const PROTECTED = [/^\/dashboard(\/|$)/, /^\/new(\/|$)/, /^\/editor(\/|$)/];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((re) => re.test(pathname));
  if (needsAuth && !req.auth) {
    const url = new URL("/signin", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }
});

export const config = {
  // Run on app routes, skip static assets / images / auth API.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
