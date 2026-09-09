// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import { POST as canonicalPOST } from "@/app/api/daily-reading/source/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const POST = canonicalPOST;
