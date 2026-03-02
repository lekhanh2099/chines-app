import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
 let supabaseResponse = NextResponse.next({
  request,
 });

 const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
   cookies: {
    getAll() {
     return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
     cookiesToSet.forEach(({ name, value, options }) =>
      request.cookies.set(name, value),
     );
     supabaseResponse = NextResponse.next({
      request,
     });
     cookiesToSet.forEach(({ name, value, options }) =>
      supabaseResponse.cookies.set(name, value, options),
     );
    },
   },
  },
 );

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
