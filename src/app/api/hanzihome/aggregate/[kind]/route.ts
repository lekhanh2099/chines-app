import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import type {
 AggregateFilters,
 AggregateKind,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{
  kind: string;
 }>;
};

function parseAggregateKind(value: string): AggregateKind | null {
 return value === "vocab" || value === "grammar" ? value : null;
}

export async function GET(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const { kind: rawKind } = await context.params;
 const kind = parseAggregateKind(rawKind);

 if (!kind) {
  return apiError("Unsupported aggregate kind", 400, "UNSUPPORTED_AGGREGATE_KIND");
 }

 const url = new URL(request.url);
 const filters: AggregateFilters = {
  courseId: url.searchParams.get("courseId") ?? "",
  bookId: url.searchParams.get("bookId") ?? "",
  lessonId: url.searchParams.get("lessonId") ?? "",
  q: url.searchParams.get("q") ?? "",
 };
 try {
  const items = await hanzihomeContentRepository.getAggregateItems({ kind, filters });

  return privateNoStoreJson({ items });
 } catch {
  return apiError("Could not load aggregate content", 503, "AGGREGATE_UNAVAILABLE");
 }
}
