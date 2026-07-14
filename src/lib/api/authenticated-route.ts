import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase.generated";

type AuthenticatedRouteContext = {
 supabase: SupabaseClient<Database>;
 user: User;
};

type AuthenticatedRouteResult =
 | { authenticated: true; context: AuthenticatedRouteContext }
 | { authenticated: false; response: NextResponse };

export function apiError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

export async function requireAuthenticatedRoute(): Promise<AuthenticatedRouteResult> {
 const supabase = await createClient();
 const {
  data: { user },
  error,
 } = await supabase.auth.getUser();

 if (error || !user) {
  return {
   authenticated: false,
   response: apiError("Unauthorized", 401, "UNAUTHORIZED"),
  };
 }

 return {
  authenticated: true,
  context: { supabase, user },
 };
}

export function privateNoStoreJson(body: unknown, init?: Omit<ResponseInit, "headers">) {
 return NextResponse.json(body, {
  ...init,
  headers: { "Cache-Control": "private, no-store" },
 });
}
