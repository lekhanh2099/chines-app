import { NextResponse } from "next/server";

import { defaultAppLocale, getLocaleFromPathname, localizePathname } from "@/i18n/config";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

function loginErrorUrl(origin: string, next: string, authError: string) {
 const locale = getLocaleFromPathname(next) ?? defaultAppLocale;
 const url = new URL(localizePathname("/login", locale), origin);
 url.searchParams.set("authError", authError);
 return url;
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const code = url.searchParams.get("code");
 const next = getSafeNextPath(url.searchParams.get("next"));

 if (!code) {
  return NextResponse.redirect(loginErrorUrl(url.origin, next, "missing_code"));
 }

 const supabase = await createClient();
 const { error } = await supabase.auth.exchangeCodeForSession(code);

 if (error) {
  return NextResponse.redirect(
   loginErrorUrl(
    url.origin,
    next,
    error.message.includes("HANZIHOME_SESSION_LIMIT_REACHED") ? "session_limit" : "code_exchange",
   ),
  );
 }

 return NextResponse.redirect(new URL(next, url.origin));
}
