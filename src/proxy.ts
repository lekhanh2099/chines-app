import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

function isInfrastructurePath(pathname: string) {
 return (
  pathname === "/api" ||
  pathname.startsWith("/api/") ||
  pathname === "/auth/callback" ||
  pathname === "/auth/confirm"
 );
}

export async function proxy(request: NextRequest) {
 const response = isInfrastructurePath(request.nextUrl.pathname)
  ? NextResponse.next({ request })
  : handleI18nRouting(request);

 return updateSession(request, response);
}

export const config = {
 matcher: [
  "/((?!_next/static|_next/image|_vercel/|fonts/|data/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff|woff2|ttf|otf|ttc)$).*)",
 ],
};
