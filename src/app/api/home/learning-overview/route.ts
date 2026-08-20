import { getHomeLearningOverview } from "@/features/home/home-learning-overview-repository.server";
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
  return privateNoStoreJson({ overview: await getHomeLearningOverview(auth.context.user.id) });
 } catch {
  return apiError("Could not load home learning overview", 503, "HOME_OVERVIEW_UNAVAILABLE");
 }
}
