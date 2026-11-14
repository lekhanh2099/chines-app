import { z } from "zod";

import { getReaderStateBootstrap } from "@/features/reading/repositories/reading-state-bootstrap.repository";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({ documentId: z.string().min(1) });

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;

 const parsed = querySchema.safeParse({
  documentId: new URL(request.url).searchParams.get("documentId"),
 });
 if (!parsed.success) return apiError("Invalid reader state query", 400, "INVALID_QUERY");

 try {
  return privateNoStoreJson(await getReaderStateBootstrap(parsed.data.documentId, auth.context));
 } catch {
  return apiError("Could not load Reader state", 503, "READER_STATE_UNAVAILABLE");
 }
}
