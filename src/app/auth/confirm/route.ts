import { NextResponse } from "next/server";

import { defaultAppLocale, getLocaleFromPathname, localizePathname } from "@/i18n/config";
import { parseEmailOtpType } from "@/lib/auth/email-otp-type";
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
 const tokenHash = url.searchParams.get("token_hash");
 const type = parseEmailOtpType(url.searchParams.get("type"));
 const next = getSafeNextPath(url.searchParams.get("next"));

 if (!tokenHash || !type) {
  return NextResponse.redirect(loginErrorUrl(url.origin, next, "invalid_confirmation"));
 }

 const supabase = await createClient();
 const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

 if (error) {
  return NextResponse.redirect(loginErrorUrl(url.origin, next, "confirmation_failed"));
 }

 return NextResponse.redirect(new URL(next, url.origin));
}
