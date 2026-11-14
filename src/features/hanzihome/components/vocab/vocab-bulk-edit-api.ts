import { z } from "zod";

import type { JsonFieldValue, JsonObject } from "@/types/json";

const PreviewSchema = z.object({
 rowCount: z.number(),
 wordCount: z.number(),
 fingerprint: z.string(),
 breakdown: z.record(z.string(), z.number()),
 ownership: z.record(z.string(), z.number()),
 sample: z.array(z.object({ id: z.string(), label: z.string() })),
});
export type Preview = z.infer<typeof PreviewSchema>;

const ChildListSchema = z.object({
 page: z.number(),
 pageSize: z.number(),
 total: z.number(),
 rows: z.array(
  z.object({
   id: z.string(),
   vocabItemId: z.string(),
   lessonId: z.string(),
   word: z.string(),
   label: z.string(),
   sectionKey: z.string().nullable(),
   ownerId: z.string().nullable(),
   source: z.string(),
   deletedAt: z.string().nullable(),
  }),
 ),
});
export type ChildList = z.infer<typeof ChildListSchema>;

const BulkResponseSchema = z.object({
 list: ChildListSchema.optional(),
 preview: PreviewSchema.optional(),
 result: z.object({ changedCount: z.number() }).optional(),
});

export async function bulkRequest(body: Partial<JsonObject>) {
 const response = await fetch("/api/hanzihome/content/vocab-children/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
 const payload: JsonFieldValue = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không thể thực hiện thao tác hàng loạt.");
 return BulkResponseSchema.parse(payload);
}
