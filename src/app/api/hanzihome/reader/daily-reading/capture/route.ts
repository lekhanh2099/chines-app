// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import { POST as canonicalPOST } from "@/app/api/daily-reading/capture/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 180;

export const POST = canonicalPOST;
