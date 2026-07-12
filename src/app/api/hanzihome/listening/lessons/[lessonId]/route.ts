import { NextResponse } from "next/server";

import { fetchListeningLessonBundle } from "@/features/hanzihome/listening/listening.repository";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{ lessonId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
 try {
  const { lessonId } = await context.params;
  const supabase = await createClient();
  const bundle = await fetchListeningLessonBundle(supabase, lessonId);

  if (!bundle) {
   return NextResponse.json({ error: "Listening lesson not found" }, { status: 404 });
  }

  return NextResponse.json(
   { bundle },
   {
    headers: {
     "Cache-Control": "private, no-store",
    },
   },
  );
 } catch (error) {
  const message = error instanceof Error ? error.message : "Unknown listening data error";
  return NextResponse.json({ error: message }, { status: 503 });
 }
}
