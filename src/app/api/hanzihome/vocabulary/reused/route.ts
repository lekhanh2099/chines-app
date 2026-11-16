import { getReusedVocabularyWords } from "@/features/hanzihome/vocabulary-index/vocabulary-index.server";
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
  return privateNoStoreJson({
   words: await getReusedVocabularyWords({ ownerId: auth.context.user.id }),
  });
 } catch {
  return apiError("Could not load reused vocabulary", 503, "VOCABULARY_UNAVAILABLE");
 }
}
