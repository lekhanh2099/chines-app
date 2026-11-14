import { libraryCoversResponseSchema } from "@/features/hanzihome/components/library/library-cover.schema";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const { data, error } = await auth.context.supabase
  .from("hanzihome_library_covers")
  .select("collection_id, cover_url, created_at, updated_at")
  .order("collection_id");
 if (error) return apiError("Could not load library covers", 503, "LIBRARY_COVERS_UNAVAILABLE");
 const result = libraryCoversResponseSchema.safeParse({
  items: data.map((cover) => ({
   collectionId: cover.collection_id,
   coverUrl: cover.cover_url,
   createdAt: cover.created_at,
   updatedAt: cover.updated_at,
  })),
 });
 if (!result.success)
  return apiError("Invalid library cover response", 500, "LIBRARY_COVERS_INVALID");
 return privateNoStoreJson(result.data);
}
