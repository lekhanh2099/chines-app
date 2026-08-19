import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
 defaultAppLocale,
 getLocaleFromPathname,
 localizePathname,
 stripLocaleFromPathname,
} from "@/i18n/config";
import { publicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/supabase.generated";

function withSecurityHeaders(response: NextResponse) {
 response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
 response.headers.set("X-Content-Type-Options", "nosniff");
 response.headers.set("X-Frame-Options", "DENY");
 response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
 return response;
}

function recreateResponseWithRequest(response: NextResponse, request: NextRequest) {
 const nextResponse = NextResponse.next({ request });
 response.headers.forEach((value, key) => nextResponse.headers.set(key, value));
 response.cookies.getAll().forEach((cookie) => nextResponse.cookies.set(cookie));
 return nextResponse;
}

export async function updateSession(request: NextRequest, initialResponse?: NextResponse) {
 const pathname = request.nextUrl.pathname;
 const logicalPathname = stripLocaleFromPathname(pathname);
 const locale = getLocaleFromPathname(pathname) ?? defaultAppLocale;
 let supabaseResponse = initialResponse ?? NextResponse.next({ request });

 if (!supabaseResponse.ok) return withSecurityHeaders(supabaseResponse);

 const isPublicReaderRoute =
  logicalPathname === "/reader" ||
  logicalPathname.startsWith("/reader/") ||
  logicalPathname === "/hsk" ||
  logicalPathname.startsWith("/hsk/");
 const isPublicStaticLearningRoute =
  isPublicReaderRoute ||
  logicalPathname === "/daily-reading" ||
  logicalPathname === "/dictation" ||
  logicalPathname === "/humanities" ||
  logicalPathname.startsWith("/humanities/") ||
  logicalPathname === "/personal-learning" ||
  logicalPathname.startsWith("/personal-learning/") ||
  logicalPathname === "/translation" ||
  logicalPathname === "/tts";

 // API handlers own their authentication boundary. Running getUser here as
 // well doubles the auth request for every API call and does not add route
 // protection because the handlers validate the session before reading or
 // mutating user data.
 if (logicalPathname === "/api" || logicalPathname.startsWith("/api/")) {
  return withSecurityHeaders(supabaseResponse);
 }

 // These pages are intentionally public. Their static content does not need
 // middleware auth, and app-shell/user-state code still resolves an optional
 // session when it is available.
 if (
  isPublicStaticLearningRoute ||
  logicalPathname === "/auth/callback" ||
  logicalPathname === "/auth/confirm"
 ) {
  return withSecurityHeaders(supabaseResponse);
 }

 const supabase = createServerClient<Database>(publicSupabaseEnv.url, publicSupabaseEnv.key, {
  cookies: {
   getAll() {
    return request.cookies.getAll();
   },
   setAll(cookiesToSet) {
    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
    supabaseResponse = recreateResponseWithRequest(supabaseResponse, request);
    cookiesToSet.forEach(({ name, value, options }) =>
     supabaseResponse.cookies.set(name, value, options),
    );
   },
  },
 });

 // IMPORTANT: Avoid writing any logic between createServerClient and
 // supabase.auth.getUser(). A simple mistake could make it very hard to debug
 // issues with users being randomly logged out.

 const {
  data: { user },
 } = await supabase.auth.getUser();

 const isLoginRoute = logicalPathname === "/login";

 if (!user && !isLoginRoute && !logicalPathname.startsWith("/_next")) {
  const url = request.nextUrl.clone();
  url.pathname = localizePathname("/login", locale);
  url.search = "";
  url.searchParams.set(
   "next",
   localizePathname(`${logicalPathname}${request.nextUrl.search}`, locale),
  );
  return withSecurityHeaders(NextResponse.redirect(url));
 }

 if (user && isLoginRoute) {
  const url = request.nextUrl.clone();
  url.pathname = localizePathname("/", locale);
  url.search = "";
  return withSecurityHeaders(NextResponse.redirect(url));
 }

 return withSecurityHeaders(supabaseResponse);
}
