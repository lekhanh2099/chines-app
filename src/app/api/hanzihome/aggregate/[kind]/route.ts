import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import {
 AggregateKindSchema,
 type AggregateFilters,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import {
 getPublishedStudioAggregateItems,
 isPublishedStudioContentId,
} from "@/features/hanzihome/static-json/studio-published-content.server";
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

export async function GET(request: Request, context: RouteContext) {
 try {
  const { kind: rawKind } = await context.params;
  const kind = AggregateKindSchema.safeParse(rawKind);

  if (!kind.success) {
   return apiError("Unsupported aggregate kind", 400, "UNSUPPORTED_AGGREGATE_KIND");
  }

  const url = new URL(request.url);
  const filters: AggregateFilters = {
   courseId: url.searchParams.get("courseId") ?? "",
   bookId: url.searchParams.get("bookId") ?? "",
   lessonId: url.searchParams.get("lessonId") ?? "",
   q: url.searchParams.get("q") ?? "",
  };
  const staticItems = getPublishedStudioAggregateItems({ kind: kind.data, filters });
  // Grammar is static content only; the database keeps the vocabulary store rows.
  if (
   kind.data !== "vocab" ||
   isPublishedStudioContentId(filters.courseId || filters.bookId || filters.lessonId)
  ) {
   return privateNoStoreJson({ items: staticItems });
  }

  const auth = await requireAuthenticatedRoute();
  if (!auth.authenticated) return auth.response;

  const items = [
   ...(await hanzihomeContentRepository.getAggregateItems({ kind: "vocab", filters })),
   ...staticItems,
  ];

  return privateNoStoreJson({ items });
 } catch {
  return apiError("Could not load aggregate content", 503, "AGGREGATE_UNAVAILABLE");
 }
}
