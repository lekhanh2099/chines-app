import { getSafeNextPath } from "./safe-next-path";

function isLocalOrigin(origin: string) {
 const hostname = new URL(origin).hostname;
 return hostname === "localhost" || hostname === "127.0.0.1";
}

export function buildOAuthCallbackUrl({
 currentOrigin,
 configuredAppUrl,
 next,
}: {
 currentOrigin: string;
 configuredAppUrl?: string;
 next?: string | null;
}) {
 const callbackOrigin =
  !isLocalOrigin(currentOrigin) && configuredAppUrl
   ? new URL(configuredAppUrl).origin
   : new URL(currentOrigin).origin;
 const callbackUrl = new URL("/auth/callback", callbackOrigin);
 callbackUrl.searchParams.set("next", getSafeNextPath(next));
 return callbackUrl.toString();
}
