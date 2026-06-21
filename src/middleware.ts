import { auth } from "@/auth";

/**
 * Gate the owner-only areas behind sign-in. Everything else — the marketing
 * site, the public trial pages at /s/[slug] (sgsitefy.com/theirsite), the
 * /api/auth routes — stays open.
 */
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
