import { z } from "zod";

// Resolved against a placeholder origin: the redirect routes build the final URL
// with `new URL(next, origin)`, so the same WHATWG parser decides safety here.
// A prefix check is not enough because the parser treats `\` as `/` and strips
// tab/CR/LF, turning values like "/\evil.example" into a foreign host.
const SAME_ORIGIN_BASE = "http://same-origin.invalid";

function isSameOriginPath(value: string) {
 return new URL(value, SAME_ORIGIN_BASE).origin === SAME_ORIGIN_BASE;
}

export function getSafeNextPath(value: z.input<z.ZodOptional<z.ZodNullable<z.ZodString>>>) {
 if (!value?.startsWith("/")) return "/";
 try {
  if (!isSameOriginPath(value)) return "/";
  const resolved = new URL(value, SAME_ORIGIN_BASE);
  const next = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  // Dot segments collapse during normalisation ("/.//evil" -> "//evil"), and the
  // caller resolves this result again, where "//host" is protocol-relative.
  // Only a result that is itself a same-origin path may be returned.
  return next.startsWith("//") || !isSameOriginPath(next) ? "/" : next;
 } catch {
  return "/";
 }
}
