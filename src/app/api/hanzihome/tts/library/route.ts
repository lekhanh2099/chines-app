import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 createTtsFolder,
 listTtsLibrary,
 saveTtsClip,
} from "@/features/hanzihome/tts/tts-studio-repository";
import { ttsClipDraftSchema } from "@/features/hanzihome/tts/tts-studio.schemas";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const folderSchema = z.strictObject({
 action: z.literal("folder"),
 name: z.string().trim().min(1),
});
const clipSchema = z.strictObject({
 action: z.literal("clip"),
 draft: ttsClipDraftSchema,
});

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 try {
  return privateNoStoreJson(await listTtsLibrary());
 } catch {
  return apiError("Could not load TTS library", 503, "TTS_LIBRARY_UNAVAILABLE");
 }
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = z.discriminatedUnion("action", [folderSchema, clipSchema]).safeParse(body);
 if (!parsed.success) return apiError("Invalid TTS library payload", 400, "INVALID_PAYLOAD");

 try {
  if (parsed.data.action === "folder") {
   return privateNoStoreJson({ folder: await createTtsFolder(parsed.data.name) });
  }
  return privateNoStoreJson({ clip: await saveTtsClip(parsed.data.draft) });
 } catch {
  return apiError("Could not save TTS library item", 409, "TTS_LIBRARY_CONFLICT");
 }
}
