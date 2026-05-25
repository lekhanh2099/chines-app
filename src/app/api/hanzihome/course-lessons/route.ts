import { NextResponse } from "next/server";

import { getDbHanziHomeCourseLessonSummaries } from "@/features/hanzihome/db-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json(
      { source: "empty", lessons: [], error: "Missing courseId" },
      { status: 400 },
    );
  }

  try {
    const lessons = await getDbHanziHomeCourseLessonSummaries(courseId);

    return NextResponse.json(
      {
        source: "db",
        lessons,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { source: "empty", lessons: [] },
      { status: 500 },
    );
  }
}
