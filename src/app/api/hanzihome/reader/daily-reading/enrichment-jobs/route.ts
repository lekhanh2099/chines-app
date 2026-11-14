// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import {
 POST as canonicalPOST,
 GET as canonicalGET,
 DELETE as canonicalDELETE,
} from "@/app/api/daily-reading/enrichment-jobs/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const POST = canonicalPOST;
export const GET = canonicalGET;
export const DELETE = canonicalDELETE;
