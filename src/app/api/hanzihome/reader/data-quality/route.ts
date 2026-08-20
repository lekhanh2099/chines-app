import { getReaderDataQualityReport } from "@/features/hanzihome/reader/reader-data-quality-repository";
import { hasHanziHomeContentCapability } from "@/features/hanzihome/server/content-capability";
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
 if (!(await hasHanziHomeContentCapability(auth.context.supabase, auth.context.user.id))) {
  return apiError("Forbidden", 403, "HANZIHOME_CONTENT_ROLE_REQUIRED");
 }
 try {
  return privateNoStoreJson(await getReaderDataQualityReport());
 } catch {
  return apiError("Could not load Reader data quality", 503, "READER_DATA_QUALITY_UNAVAILABLE");
 }
}
