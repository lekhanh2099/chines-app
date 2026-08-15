import { z } from "zod";

import { listReaderDocuments } from "@/features/hanzihome/reader/reader-content-repository";
import { readerKindSchema } from "@/features/hanzihome/reader/reader.schemas";
import { apiError, privateNoStoreJson } from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({ kind: readerKindSchema.optional() });

export async function GET(request: Request) {
 const parsed = querySchema.safeParse({
  kind: new URL(request.url).searchParams.get("kind") ?? undefined,
 });
 if (!parsed.success) return apiError("Invalid reader catalog query", 400, "INVALID_QUERY");

 return privateNoStoreJson({ documents: await listReaderDocuments(parsed.data.kind) });
}
