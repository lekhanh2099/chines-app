import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/supabase.generated";

function withSecurityHeaders(response: NextResponse) {
 response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
 response.headers.set("X-Content-Type-Options", "nosniff");
 response.headers.set("X-Frame-Options", "DENY");
 response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
 return response;
}

export async function updateSession(request: NextRequest) {
 const pathname = request.nextUrl.pathname;

 const isPublicReaderRoute =
  pathname === "/reader" ||
  pathname.startsWith("/reader/") ||
  pathname === "/hsk" ||
  pathname.startsWith("/hsk/");
 const isPublicStaticLearningRoute =
  isPublicReaderRoute ||
  pathname === "/daily-reading" ||
  pathname === "/dictation" ||
  pathname === "/humanities" ||
  pathname.startsWith("/humanities/") ||
  pathname === "/personal-learning" ||
  pathname === "/translation" ||
  pathname === "/tts";

 // API handlers own their authentication boundary. Running getUser here as
 // well doubles the auth request for every API call and does not add route
 // protection because the handlers validate the session before reading or
 // mutating user data.
 if (pathname === "/api" || pathname.startsWith("/api/")) {
  return withSecurityHeaders(NextResponse.next({ request }));
 }

 // These pages are intentionally public. Their static content does not need
 // middleware auth, and app-shell/user-state code still resolves an optional
 // session when it is available.
 if (isPublicStaticLearningRoute || pathname === "/auth/callback" || pathname === "/auth/confirm") {
  return withSecurityHeaders(NextResponse.next({ request }));
 }

 let supabaseResponse = NextResponse.next({
  request,
 });

 const supabase = createServerClient<Database>(publicSupabaseEnv.url, publicSupabaseEnv.key, {
  cookies: {
   getAll() {
    return request.cookies.getAll();
   },
   setAll(cookiesToSet) {
    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
    supabaseResponse = NextResponse.next({
     request,
    });
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

 const isLoginRoute = pathname === "/login";

 // Public routes returned above do not reach this branch. Protect the app
 // routes here while retaining the existing login-page redirect behavior.
 if (!user && !isLoginRoute && !pathname.startsWith("/_next")) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return withSecurityHeaders(NextResponse.redirect(url));
 }

 // If there is a user and the route is /login, redirect to dashboard.
 if (user && isLoginRoute) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return withSecurityHeaders(NextResponse.redirect(url));
 }

 return withSecurityHeaders(supabaseResponse);
}
