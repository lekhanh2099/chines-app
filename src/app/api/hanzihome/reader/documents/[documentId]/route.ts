import { apiError, privateNoStoreJson } from "@/lib/api/authenticated-route";
import { getReaderDocument } from "@/features/hanzihome/reader/reader-content-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(_request: Request, context: RouteContext) {
 const { documentId } = await context.params;
 if (!documentId) return apiError("Reader document is required", 400, "INVALID_DOCUMENT");

 const resource = await getReaderDocument(documentId);
 if (resource === null) return apiError("Reader document not found", 404, "READER_NOT_FOUND");
 return privateNoStoreJson(resource);
}
