import { NextResponse } from "next/server";

import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import type {
 AggregateFilters,
 AggregateKind,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{
  kind: string;
 }>;
};

function jsonError(message: string, status: number) {
 return NextResponse.json({ error: message }, { status });
}

function parseAggregateKind(value: string): AggregateKind | null {
 return value === "vocab" || value === "grammar" ? value : null;
}

export async function GET(request: Request, context: RouteContext) {
 const { kind: rawKind } = await context.params;
 const kind = parseAggregateKind(rawKind);

 if (!kind) {
  return jsonError("Unsupported aggregate kind", 400);
 }

 const url = new URL(request.url);
 const filters: AggregateFilters = {
  courseId: url.searchParams.get("courseId") ?? "",
  bookId: url.searchParams.get("bookId") ?? "",
  lessonId: url.searchParams.get("lessonId") ?? "",
  q: url.searchParams.get("q") ?? "",
 };
 try {
  const items = await hanzihomeContentRepository.getAggregateItems({ kind, filters });

  return NextResponse.json(
   { items },
   {
    headers: {
     "Cache-Control": "no-store",
    },
   },
  );
 } catch (error) {
  const message = error instanceof Error ? error.message : "Unknown Supabase error";
  return jsonError(message, 503);
 }
}
