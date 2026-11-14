// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import { GET as canonicalGET } from "@/app/api/daily-reading/enrichment-jobs/stream/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = canonicalGET;
