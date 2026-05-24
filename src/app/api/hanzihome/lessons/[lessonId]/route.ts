import { NextResponse } from "next/server";

import { getDbHanziHomeLessonDetail } from "@/features/hanzihome/db-data";

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { lessonId } = await context.params;

  try {
    const lesson = await getDbHanziHomeLessonDetail(lessonId);

    if (!lesson) {
      return NextResponse.json(
        { source: "empty", lesson: null },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { source: "db", lesson },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { source: "empty", lesson: null },
      { status: 500 },
    );
  }
}
