// Compatibility endpoint: delegate directly, without redirects or duplicate validation.
import { GET as canonicalGET } from "@/app/api/reading/documents/[documentId]/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = canonicalGET;
