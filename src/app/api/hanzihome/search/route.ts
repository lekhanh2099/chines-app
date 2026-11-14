import { searchHanziHome } from "@/features/hanzihome/search/server/hanzihome-search.service";
import { HanziHomeSearchRequestSchema } from "@/features/hanzihome/search/types";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const params = new URL(request.url).searchParams;
 const parsed = HanziHomeSearchRequestSchema.safeParse({
  q: params.get("q") ?? "",
  category: params.get("category") ?? undefined,
  limit: params.get("limit") ?? undefined,
  courseId: params.get("courseId") || undefined,
  lessonId: params.get("lessonId") || undefined,
 });
 if (!parsed.success) return apiError("Invalid search request", 400, "INVALID_SEARCH_REQUEST");

 try {
  return privateNoStoreJson(await searchHanziHome(auth.context, parsed.data));
 } catch {
  return apiError("Could not search HanziHome", 503, "SEARCH_UNAVAILABLE");
 }
}
