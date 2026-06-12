import { NextResponse } from "next/server";

import type { HanziHomeDbEditDraft } from "@/features/hanzihome/editor/hanzihome-db-edit.types";
import { saveHanziHomeDbEditDraft } from "@/features/hanzihome/editor/hanzihome-db-edit-service";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
 return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
 const body = await request.json().catch(() => null);
 const draft = isRecord(body) ? body.draft : undefined;

 if (!isRecord(draft)) {
  return NextResponse.json(
   {
    ok: false,
    errors: [{ path: "draft", message: "Draft payload is required." }],
   },
   { status: 400 },
  );
 }

 const result = await saveHanziHomeDbEditDraft(draft as HanziHomeDbEditDraft);

 return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
