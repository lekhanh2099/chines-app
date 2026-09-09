// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import {
 PATCH as canonicalPATCH,
 DELETE as canonicalDELETE,
} from "@/app/api/reading/annotations/[annotationId]/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const PATCH = canonicalPATCH;
export const DELETE = canonicalDELETE;
