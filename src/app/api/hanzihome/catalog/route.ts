import { NextResponse } from "next/server";

import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";

export const revalidate = 300;

function parseBooleanParam(value: string | null) {
 return value === "1" || value === "true";
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const includeLessons = parseBooleanParam(url.searchParams.get("includeLessons"));
 const catalog = hanzihomeContentRepository.getCatalogSummary({
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
}
