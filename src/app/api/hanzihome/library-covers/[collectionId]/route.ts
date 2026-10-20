import { z } from "zod";

import {
 libraryCollectionIdSchema,
 libraryCoverResponseSchema,
 resetLibraryCoverPayloadSchema,
 resetLibraryCoverResponseSchema,
 saveLibraryCoverPayloadSchema,
} from "@/features/hanzihome/components/library/library-cover.schema";
import { hasHanziHomeContentCapability } from "@/features/hanzihome/server/content-capability";
import { mutationError } from "@/features/hanzihome/server/canonical-content-mutation";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import type { JsonFieldValue } from "@/types/json";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ collectionId: string }> };

function statusForMutationError(code: Parameters<typeof apiError>[2]) {
 if (code === "40001") return 409;
 if (code === "28000") return 401;
 if (code === "42501") return 403;
 if (code === "22023" || code === "23514") return 400;
 return 500;
}

export async function PUT(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 if (!(await hasHanziHomeContentCapability(auth.context.supabase, auth.context.user.id)))
  return apiError("Forbidden", 403, "HANZIHOME_CONTENT_ROLE_REQUIRED");
 const { collectionId } = await context.params;
 const id = libraryCollectionIdSchema.safeParse(collectionId);
 if (!id.success) return apiError("Invalid library collection", 400);
 const body: JsonFieldValue = await request.json().catch(() => null);
 const payload = saveLibraryCoverPayloadSchema.safeParse(body);
 if (!payload.success)
  return mutationError("Invalid library cover payload", 400, z.flattenError(payload.error));
 const { data, error } = await auth.context.supabase.rpc("hanzihome_mutate_library_cover_as_user", {
  p_collection_id: id.data,
  p_cover_url: payload.data.coverUrl,
  p_expected_updated_at: payload.data.expectedUpdatedAt,
  p_reason: payload.data.reason,
 });
 if (error) return mutationError(error.message, statusForMutationError(error.code), error.code);
 const result = libraryCoverResponseSchema.safeParse(data);
 if (!result.success || result.data.item.collectionId !== id.data)
  return apiError("Invalid library cover acknowledgement", 500);
 return privateNoStoreJson(result.data);
}

export async function DELETE(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 if (!(await hasHanziHomeContentCapability(auth.context.supabase, auth.context.user.id)))
  return apiError("Forbidden", 403, "HANZIHOME_CONTENT_ROLE_REQUIRED");
 const { collectionId } = await context.params;
 const id = libraryCollectionIdSchema.safeParse(collectionId);
 if (!id.success) return apiError("Invalid library collection", 400);
 const body: JsonFieldValue = await request.json().catch(() => null);
 const payload = resetLibraryCoverPayloadSchema.safeParse(body);
 if (!payload.success)
  return mutationError("Invalid cover reset payload", 400, z.flattenError(payload.error));
 const { data, error } = await auth.context.supabase.rpc("hanzihome_mutate_library_cover_as_user", {
  p_collection_id: id.data,
  p_expected_updated_at: payload.data.expectedUpdatedAt,
  p_reset: true,
  p_reason: payload.data.reason,
 });
 if (error) return mutationError(error.message, statusForMutationError(error.code), error.code);
 const result = resetLibraryCoverResponseSchema.safeParse(data);
 if (!result.success || result.data.collectionId !== id.data)
  return apiError("Invalid library cover reset acknowledgement", 500);
 return privateNoStoreJson(result.data);
}
