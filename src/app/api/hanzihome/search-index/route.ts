import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import { buildHanziHomeSearchIndex } from "@/features/hanzihome/search/buildSearchIndex";
import type { HanziHomeSearchIndexItem } from "@/features/hanzihome/search/types";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory server cache with 5-minute TTL to accelerate repeated index fetches
const SEARCH_INDEX_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSearchIndex: { items: HanziHomeSearchIndexItem[]; expiresAt: number } | null = null;

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 try {
  const now = Date.now();
  if (cachedSearchIndex && cachedSearchIndex.expiresAt > now) {
   return privateNoStoreJson({ items: cachedSearchIndex.items });
  }

  const data = await hanzihomeContentRepository.getSearchData();
  const items = buildHanziHomeSearchIndex(data);

  cachedSearchIndex = {
   items,
   expiresAt: now + SEARCH_INDEX_CACHE_TTL_MS,
  };

  return privateNoStoreJson({ items });
 } catch {
  return apiError("Could not load search index", 503, "SEARCH_INDEX_UNAVAILABLE");
 }
}
