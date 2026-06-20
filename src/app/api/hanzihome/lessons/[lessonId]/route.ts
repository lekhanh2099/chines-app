import { NextResponse } from "next/server";

import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";

export const revalidate = 300;

type RouteContext = {
 params: Promise<{
  lessonId: string;
 }>;
};

function jsonError(message: string, status: number) {
 return NextResponse.json({ error: message }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
 try {
  const { lessonId } = await context.params;
  const lesson = await hanzihomeContentRepository.getLessonDetail(lessonId);

  if (!lesson) {
   return jsonError("Lesson not found", 404);
  }

  return NextResponse.json(
   { lesson },
   {
    headers: {
     "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
   },
  );
 } catch (error) {
  const message = error instanceof Error ? error.message : "Unknown Supabase error";
  return jsonError(message, 503);
 }
}
