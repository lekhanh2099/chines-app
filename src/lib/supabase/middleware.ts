import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/supabase.generated";

export async function updateSession(request: NextRequest) {
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

 const isPublicRoute = request.nextUrl.pathname === "/login";

 // If there is no user and the route is not public, redirect to login page.
 if (
  !user &&
  !isPublicRoute &&
  !request.nextUrl.pathname.startsWith("/_next") &&
  !request.nextUrl.pathname.startsWith("/api")
 ) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
 }

 // If there is a user and the route is /login, redirect to dashboard.
 if (user && isPublicRoute) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
 }

 return supabaseResponse;
}
