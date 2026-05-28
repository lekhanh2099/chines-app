import { NextResponse } from "next/server";

import { getHanziHomeLessonDetail } from "@/features/hanzihome/static-data";

export async function GET(
 _request: Request,
 { params }: { params: Promise<{ lessonId: string }> },
) {
 const { lessonId } = await params;
 const lesson = getHanziHomeLessonDetail(lessonId);

 return NextResponse.json(
  {
   source: lesson ? "static" : "empty",
   lesson,
  },
  {
   status: lesson ? 200 : 404,
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}
