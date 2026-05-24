import { NextResponse } from "next/server";

import { getDbHanziHomeData } from "@/features/hanzihome/db-data";
import type { HanziHomeData } from "@/features/hanzihome/types";

function jsonNoStore(body: {
  source: "db" | "empty";
  hasSeededLessons: boolean;
  data: HanziHomeData;
}) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  try {
    const data = await getDbHanziHomeData();

    if (data.lessons.length === 0) {
      return jsonNoStore({
        source: "empty",
        hasSeededLessons: false,
        data,
      });
    }

    return jsonNoStore({
      source: "db",
      hasSeededLessons: true,
      data,
    });
  } catch {
    return NextResponse.json(
      {
        source: "error",
        hasSeededLessons: false,
        error: "Could not load DB-backed HanziHome data",
      },
      { status: 500 },
    );
  }
}
