import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, rtlLocales, type Locale } from "./i18n/request";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Apply intl middleware for page routes
  const response = intlMiddleware(request);

  // Detect RTL languages and set direction header
  const locale = request.cookies.get("NEXT_LOCALE")?.value || defaultLocale;
  if (rtlLocales.includes(locale as Locale)) {
    (response as NextResponse).headers.set("x-locale-dir", "rtl");
  }

  return response as NextResponse;
}

export const config = {
  matcher: [
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
