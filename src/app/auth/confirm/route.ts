import { NextResponse } from "next/server";

import { parseEmailOtpType } from "@/lib/auth/email-otp-type";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
 const url = new URL(request.url);
 const tokenHash = url.searchParams.get("token_hash");
 const type = parseEmailOtpType(url.searchParams.get("type"));
 const next = getSafeNextPath(url.searchParams.get("next"));

 if (!tokenHash || !type) {
  return NextResponse.redirect(new URL("/login?authError=invalid_confirmation", url.origin));
 }

 const supabase = await createClient();
 const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

 if (error) {
  return NextResponse.redirect(new URL("/login?authError=confirmation_failed", url.origin));
 }

 return NextResponse.redirect(new URL(next, url.origin));
}
