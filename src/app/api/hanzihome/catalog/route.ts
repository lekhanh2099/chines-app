import { NextResponse } from "next/server";

import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";

export const revalidate = 300;

function parseBooleanParam(value: string | null) {
 return value === "1" || value === "true";
}

export async function GET(request: Request) {
 try {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId")?.trim();

  if (courseId) {
   const lessons = await hanzihomeContentRepository.getCourseLessonSummaries(courseId);

   return NextResponse.json(
    { lessons },
    {
     headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
     },
    },
   );
  }

  const includeLessons = parseBooleanParam(url.searchParams.get("includeLessons"));
  const catalog = await hanzihomeContentRepository.getCatalogSummary({
   includeLessons,
  });

  return NextResponse.json(
   { catalog },
   {
    headers: {
     "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
   },
  );
 } catch (error) {
  const message = error instanceof Error ? error.message : "Unknown Supabase error";
  return NextResponse.json({ error: message }, { status: 503 });
 }
}
