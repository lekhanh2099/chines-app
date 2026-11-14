// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import { GET as canonicalGET, POST as canonicalPOST } from "@/app/api/reading/annotations/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = canonicalGET;
export const POST = canonicalPOST;
