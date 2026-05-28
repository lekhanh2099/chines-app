import { NextResponse } from "next/server";

import { getHanziHomeCatalogSummary } from "@/features/hanzihome/static-data";

export async function GET(request: Request) {
 const url = new URL(request.url);
 const includeLessons = url.searchParams.get("includeLessons") === "1";
 const data = getHanziHomeCatalogSummary(includeLessons);

 return NextResponse.json(
  {
   source: "static",
   courses: data.courses,
   books: data.books,
   lessons: includeLessons ? data.lessons : undefined,
   meta: data.meta,
  },
  {
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}
