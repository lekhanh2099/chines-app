import { NextResponse } from "next/server";

import { getStaticAggregateVocabFallback } from "@/features/hanzihome/aggregate-static";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLimit(value: string | null) {
 if (value === null || value.trim() === "") return 1500;

 const parsed = Number(value);

 if (!Number.isFinite(parsed)) return 1500;

 return Math.min(Math.max(Math.trunc(parsed), 1), 1500);
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const limit = parseLimit(url.searchParams.get("limit"));

 const items = getStaticAggregateVocabFallback({
  courseId: url.searchParams.get("courseId"),
  bookId: url.searchParams.get("bookId"),
  lessonId: url.searchParams.get("lessonId"),
  q: url.searchParams.get("q"),
  limit,
 });

 return NextResponse.json(
  {
   items,
   debug: {
    source: "static-bundle-vocab",
    limit,
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
