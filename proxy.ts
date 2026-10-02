import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Trailing slashes matter: these are prefix matches, and a bare "/p" would
// also match "/projects". Public note routes check `isPublic` themselves.
const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/p/",
  "/api/public/",
  "/api/attachments/",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|site.webmanifest|android-chrome-192x192.png|android-chrome-512x512.png).*)",
  ],
};
