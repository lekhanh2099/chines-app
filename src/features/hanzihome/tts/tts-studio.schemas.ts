import { z } from "zod";

import { buildCacheKey } from "@/lib/tts-cache";

export const ttsFolderRowSchema = z.strictObject({
 id: z.uuid(),
 user_id: z.uuid(),
 name: z.string().trim().min(1),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const ttsClipRowSchema = z.strictObject({
 id: z.uuid(),
 user_id: z.uuid(),
 folder_id: z.uuid().nullable(),
 title: z.string(),
 text: z.string().trim().min(1),
 voice: z.string().trim().min(1),
 rate: z.number().positive().max(3),
 cache_key: z.string().trim().min(1),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const ttsClipDraftSchema = z
 .strictObject({
  folderId: z.uuid().nullable(),
  title: z.string().default(""),
  text: z.string().trim().min(1),
  voice: z.string().trim().min(1),
  rate: z.number().positive().max(3),
  cacheKey: z.string().trim().min(1),
 })
 .superRefine((draft, context) => {
  if (draft.cacheKey !== buildCacheKey(draft.text, draft.voice, draft.rate)) {
   context.addIssue({
    code: "custom",
    path: ["cacheKey"],
    message: "TTS cache key must match text, voice, and rate.",
   });
  }
 });

export type TtsFolderRow = z.output<typeof ttsFolderRowSchema>;
export type TtsClipRow = z.output<typeof ttsClipRowSchema>;
export type TtsClipDraft = z.output<typeof ttsClipDraftSchema>;
