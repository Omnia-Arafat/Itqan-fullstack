import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { LOCALE_COOKIE, routing } from "@/i18n/routing";

/**
 * `localeDetection: false` keeps Arabic as the default for every first-time
 * visitor regardless of their browser's Accept-Language. The saved preference is
 * honoured explicitly below instead, so switching to English sticks but an
 * en-US browser does not silently override the Arabic default.
 */
const handleI18n = createMiddleware({ ...routing, localeDetection: false });

function hasLocalePrefix(pathname: string) {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

/**
 * Refreshes the teacher/admin auth session so Server Components see a valid
 * cookie. Students never sign in, so this is a no-op for them.
 */
function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Lets the app boot before Supabase credentials are filled in.
  if (!url || !key) return null;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  return supabase.auth.getUser();
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;

  // Someone who chose English earlier lands on an unprefixed (Arabic) URL:
  // send them to the English equivalent.
  if (saved === "en" && !hasLocalePrefix(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const response = handleI18n(request);
  await refreshSupabaseSession(request, response);
  return response;
}

export const config = {
  // Everything except API routes, Next internals, and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
