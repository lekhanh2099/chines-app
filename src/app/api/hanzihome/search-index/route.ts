import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import { buildHanziHomeSearchIndex } from "@/features/hanzihome/search/buildSearchIndex";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 try {
  const data = await hanzihomeContentRepository.getSearchData();
  const items = buildHanziHomeSearchIndex(data);

  return privateNoStoreJson({ items });
 } catch {
  return apiError("Could not load search index", 503, "SEARCH_INDEX_UNAVAILABLE");
 }
}
