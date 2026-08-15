import { getReaderDataQualityReport } from "@/features/hanzihome/reader/reader-data-quality-repository";
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
  return privateNoStoreJson(await getReaderDataQualityReport());
 } catch {
  return apiError("Could not load Reader data quality", 503, "READER_DATA_QUALITY_UNAVAILABLE");
 }
}
