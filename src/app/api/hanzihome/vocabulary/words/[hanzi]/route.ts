import { getVocabularyEntries } from "@/features/hanzihome/vocabulary-index/vocabulary-index.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{
  hanzi: string;
 }>;
};

export async function GET(_request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const hanzi = (await context.params).hanzi.trim().slice(0, 64);
 if (!hanzi) return apiError("Missing word", 400, "INVALID_VOCABULARY_WORD");

 try {
  return privateNoStoreJson({
   entries: await getVocabularyEntries({ ownerId: auth.context.user.id, hanzi }),
  });
 } catch {
  return apiError("Could not load vocabulary word", 503, "VOCABULARY_UNAVAILABLE");
 }
}
