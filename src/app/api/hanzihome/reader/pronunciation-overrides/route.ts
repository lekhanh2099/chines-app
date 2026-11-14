// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import {
 GET as canonicalGET,
 PUT as canonicalPUT,
 DELETE as canonicalDELETE,
} from "@/app/api/reading/pronunciation-overrides/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = canonicalGET;
export const PUT = canonicalPUT;
export const DELETE = canonicalDELETE;
