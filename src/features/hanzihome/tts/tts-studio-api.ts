import {
 ttsClipDraftSchema,
 ttsClipResponseSchema,
 ttsFolderResponseSchema,
 ttsLibraryResponseSchema,
 type TtsFolderRow,
} from "./tts-studio.schemas";
import type { z } from "zod";

export async function fetchTtsLibrary(signal?: AbortSignal) {
 const response = await fetch("/api/hanzihome/tts/library", { cache: "no-store", signal });
 if (!response.ok) throw new Error("Không tải được thư viện giọng đọc.");
 return ttsLibraryResponseSchema.parse(await response.json());
}

export async function createTtsFolder(name: TtsFolderRow["name"]) {
 const response = await fetch("/api/hanzihome/tts/library", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "folder", name }),
 });
 if (!response.ok) throw new Error("Không lưu được thư mục giọng đọc.");
 return ttsFolderResponseSchema.parse(await response.json()).folder;
}

export async function saveTtsClip(draft: z.output<typeof ttsClipDraftSchema>) {
 const response = await fetch("/api/hanzihome/tts/library", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "clip", draft: ttsClipDraftSchema.parse(draft) }),
 });
 if (!response.ok) throw new Error("Không lưu được bản ghi âm.");
 return ttsClipResponseSchema.parse(await response.json()).clip;
}
