import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
 return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const code = url.searchParams.get("code");
 const next = safeNextPath(url.searchParams.get("next"));

 if (!code) {
  return NextResponse.redirect(new URL("/login?authError=missing_code", url.origin));
 }

 const supabase = await createClient();
 const { error } = await supabase.auth.exchangeCodeForSession(code);

 if (error) {
  return NextResponse.redirect(new URL("/login?authError=code_exchange", url.origin));
 }

 return NextResponse.redirect(new URL(next, url.origin));
}
