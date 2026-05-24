import { NextResponse } from "next/server";

import { getStaticAggregateVocabFallback } from "@/features/hanzihome/aggregate-static";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLimit(value: string | null) {
 const parsed = Number(value);

 if (!Number.isFinite(parsed)) return 1500;

 return Math.min(Math.max(Math.trunc(parsed), 1), 1500);
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const courseId = url.searchParams.get("courseId");
 const bookId = url.searchParams.get("bookId");
 const lessonId = url.searchParams.get("lessonId");
 const q = url.searchParams.get("q")?.trim() || null;
 const limit = parseLimit(url.searchParams.get("limit"));

 const items = getStaticAggregateVocabFallback({
  courseId,
  bookId,
  lessonId,
  q,
  limit,
 });

 return NextResponse.json(
  {
   items,
   debug: {
    source: "static-bundle-vocab",
    count: items.length,
   },
  },
  {
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}
