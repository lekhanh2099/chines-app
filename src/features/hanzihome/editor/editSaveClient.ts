"use client";

import type {
 HanziHomeDbEditDraft,
 HanziHomeDbEditSaveResult,
} from "./hanzihome-db-edit.types";

export async function saveHanziHomeDbEditDraftClient(
 draft: HanziHomeDbEditDraft,
): Promise<HanziHomeDbEditSaveResult> {
 const response = await fetch("/api/hanzihome-db/edit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ draft }),
 });
 const result = (await response.json().catch(() => null)) as
  | HanziHomeDbEditSaveResult
  | null;

 if (!response.ok || !result?.ok) {
  return {
   ok: false,
   targetPath: result?.targetPath ?? "",
   errors:
    result?.errors?.length
     ? result.errors
     : [{ path: "request", message: "Không lưu được module HanziHome DB." }],
  };
 }

 return result;
}

