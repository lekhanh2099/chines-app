// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import { GET as canonicalGET, PUT as canonicalPUT } from "@/app/api/reading/progress/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = canonicalGET;
export const PUT = canonicalPUT;
