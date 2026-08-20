import type { JsonFieldValue } from "@/types/json";
import "server-only";

import {
 createClient as createSupabaseClient,
 type SupabaseClient,
 type User,
} from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { publicSupabaseEnv } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase.generated";

export const expectedAuthenticatedOwnerHeader = "X-HanziHome-Owner-Id";

export type AuthenticatedRouteContext = {
 supabase: SupabaseClient<Database>;
 user: User;
};

type AuthenticatedRouteResultMap = {
 authenticated: { authenticated: true; context: AuthenticatedRouteContext };
 unauthenticated: { authenticated: false; response: NextResponse };
};
type AuthenticatedRouteResult = AuthenticatedRouteResultMap[keyof AuthenticatedRouteResultMap];

export function apiError(message: string, status: number, code?: string) {
 return privateNoStoreJson({ error: message, ...(code ? { code } : {}) }, { status });
}

export function verifyExpectedAuthenticatedOwner(
 request: Request,
 context: AuthenticatedRouteContext,
): NextResponse | null {
 const expectedOwner = request.headers.get(expectedAuthenticatedOwnerHeader);
 if (expectedOwner === context.user.id) return null;

 return apiError(
  "Request owner no longer matches the authenticated session",
  412,
  "AUTH_OWNER_MISMATCH",
 );
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

function readBearerAccessToken(request: Request) {
 const authorization = request.headers.get("authorization");
 if (authorization === null) return null;

 const match = authorization.match(/^Bearer\s+(.+)$/i);

 return match?.[1]?.trim() || "";
}

function createBearerSupabaseClient(accessToken: string) {
 return createSupabaseClient<Database>(publicSupabaseEnv.url, publicSupabaseEnv.key, {
  auth: {
   autoRefreshToken: false,
   persistSession: false,
  },
  global: {
   headers: {
    Authorization: `Bearer ${accessToken}`,
   },
  },
 });
}

/**
 * Routes must opt into this boundary. Existing route handlers remain
 * cookie-session only unless they call this function deliberately.
 */
export async function requireSessionOrBearerAuthenticatedRoute(
 request: Request,
): Promise<AuthenticatedRouteResult> {
 const accessToken = readBearerAccessToken(request);

 if (accessToken === null) {
  return requireAuthenticatedRoute();
 }

 if (!accessToken) {
  return {
   authenticated: false,
   response: apiError("Unauthorized", 401, "UNAUTHORIZED"),
  };
 }

 const supabase = createBearerSupabaseClient(accessToken);
 const {
  data: { user },
  error,
 } = await supabase.auth.getUser(accessToken);

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

export function privateNoStoreJson(body: JsonFieldValue, init?: Omit<ResponseInit, "headers">) {
 return NextResponse.json(body, {
  ...init,
  headers: { "Cache-Control": "private, no-store" },
 });
}
