import { NextResponse } from "next/server";

import { getHanziHomeCatalogSummary } from "@/features/hanzihome/static-data";

export async function GET(request: Request) {
 const url = new URL(request.url);
 const courseId = url.searchParams.get("courseId");

 const data = getHanziHomeCatalogSummary(true);
 const lessons = courseId
  ? data.lessons.filter((lesson) => lesson.courseId === courseId)
  : data.lessons;

 return NextResponse.json(
  {
   source: "static",
   lessons,
  },
  {
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}
