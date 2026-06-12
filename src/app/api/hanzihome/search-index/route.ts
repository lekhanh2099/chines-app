import { NextResponse } from "next/server";

import { buildHanziHomeSearchIndex } from "@/features/hanzihome/search/buildSearchIndex";

export const revalidate = 300;

export async function GET() {
 const items = buildHanziHomeSearchIndex();

 return NextResponse.json(
  { items },
  {
   headers: {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
   },
  },
 );
}
