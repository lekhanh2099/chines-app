import type { JsonFieldValue } from "@/types/json";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import {
 mutateCanonicalContent,
 mutationError,
} from "@/features/hanzihome/server/canonical-content-mutation";
import { SectionSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";

export const dynamic = "force-dynamic";

const createSectionSchema = z.object({
 reason: z.string().trim().min(1).default("Tạo đề mục HanziHome"),
 changes: z.object({
  lesson_id: z.string().min(1),
  section_type: z.enum([
   "text",
   "notes",
   "exercises",
   "reading",
   "character_writing",
   "proper_nouns",
   "communication",
   "summary",
  ]),
  title: z.string().trim().min(1),
  title_vi: z.string().trim().default(""),
 }),
});

export async function POST(request: Request) {
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = createSectionSchema.safeParse(body);
 if (!parsed.success) {
  return mutationError("Invalid section payload", 400, z.flattenError(parsed.error));
 }

 const sourceSectionId = `section_${randomUUID()}`;
 const collectionKey = parsed.data.changes.section_type === "text" ? "blocks" : "items";
 const payload = SectionSchema.parse({
  id: sourceSectionId,
  type: parsed.data.changes.section_type,
  order: 1,
  title: parsed.data.changes.title,
  title_vi: parsed.data.changes.title_vi,
  [collectionKey]: [],
 });
 const nextRequest = new Request(request.url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
   reason: parsed.data.reason,
   changes: {
    lesson_id: parsed.data.changes.lesson_id,
    source_section_id: sourceSectionId,
    section_key: sourceSectionId,
    section_type: parsed.data.changes.section_type,
    title: parsed.data.changes.title,
    title_vi: parsed.data.changes.title_vi,
    payload,
   },
  }),
 });
 return mutateCanonicalContent({
  request: nextRequest,
  entityType: "section",
  operation: "create",
 });
}
