import { NextResponse } from "next/server";

import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import { buildHanziHomeSearchIndex } from "@/features/hanzihome/search/buildSearchIndex";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
 try {
  const data = await hanzihomeContentRepository.getSearchData();
  const items = buildHanziHomeSearchIndex(data);

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
  return NextResponse.json({ error: message }, { status: 503 });
 }
}
