import { NextResponse } from "next/server";

import { getDbHanziHomeCatalogSummary } from "@/features/hanzihome/db-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeLessons = url.searchParams.get("includeLessons") === "1";

  try {
    const data = await getDbHanziHomeCatalogSummary({ includeLessons });

    return NextResponse.json(
      {
        source: data.source,
        courses: data.courses,
        books: data.books,
        lessons: includeLessons ? data.lessons : undefined,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { source: "empty", courses: [], books: [], lessons: [] },
      { status: 500 },
    );
  }
}
