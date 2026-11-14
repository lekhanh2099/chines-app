import { describe, expect, it } from "vitest";

import {
 parseReaderExerciseItemRow,
 readerExerciseItemRowSchema,
} from "@/features/reading/model/reading-exercise.schemas";
import { readerAnnotationRowSchema } from "@/features/reading/model/reading-annotation.schemas";
import { readerAssetRowSchema } from "@/features/reading/model/reading-assets.schemas";
import { readerParagraphRowSchema } from "@/features/reading/model/reading-resource.schemas";
import { readerProgressRowSchema } from "@/features/reading/model/reading-progress.schemas";
import { parsedHumanitiesExerciseItemRowSchema } from "@/features/humanities/model/humanities-exercise.schemas";
import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";

describe("HanziHome Reader row contracts", () => {
 it("validates Humanities extensions without weakening common exercise rules", () => {
  const humanitiesDocumentIds = new Set(
   studioSeed.reader.documents
    .filter((document) => document.kind === "humanities")
    .map((document) => document.id),
  );
  const humanitiesGroupIds = new Set(
   studioSeed.reader.exerciseGroups
    .filter((group) => humanitiesDocumentIds.has(group.document_id))
    .map((group) => group.id),
  );
  const rows = studioSeed.reader.exerciseItems.filter((item) =>
   humanitiesGroupIds.has(item.group_id),
  );
  expect(rows.length).toBeGreaterThan(0);
  for (const source of rows) {
   const row = readerExerciseItemRowSchema.parse(source);
   expect(parsedHumanitiesExerciseItemRowSchema.parse(row)).toEqual(source);
   if (row.payload.source !== undefined) {
    expect(() => parseReaderExerciseItemRow(row), row.id).toThrow();
   }
   expect(
    parsedHumanitiesExerciseItemRowSchema.safeParse({
     ...row,
     payload: { ...row.payload, scoring: "invalid" },
    }).success,
   ).toBe(false);
   expect(
    parsedHumanitiesExerciseItemRowSchema.safeParse({
     ...row,
     payload: { ...row.payload, source: { sourceId: "incomplete" } },
    }).success,
   ).toBe(false);
   expect(
    parsedHumanitiesExerciseItemRowSchema.safeParse({
     ...row,
     payload: { ...row.payload, unsupportedField: true },
    }).success,
   ).toBe(false);
  }
 });

 it("rejects unordered or empty paragraph rows at the repository boundary", () => {
  expect(
   readerParagraphRowSchema.safeParse({
    id: "paragraph-1",
    document_id: "document-1",
    source: "seed",
    paragraph_order: 0,
    zh: "你好",
    pinyin: "nǐ hǎo",
    vi: "xin chào",
    role_vi: "mở bài",
    source_version: 1,
    created_at: "2026-08-14T00:00:00Z",
    updated_at: "2026-08-14T00:00:00Z",
   }).success,
  ).toBe(false);
 });

 it("keeps exercise payloads as validated JSON objects", () => {
  const row = readerExerciseItemRowSchema.parse({
   id: "item-1",
   group_id: "group-1",
   source: "seed",
   item_order: 1,
   item_type: "multiple_choice",
   payload: {
    promptZh: "请选择",
    promptVi: "Hãy chọn",
    pinyin: "Qǐng xuǎnzé",
    options: [
     { key: "A", textZh: "A", textVi: "A" },
     { key: "B", textZh: "B", textVi: "B" },
    ],
    answer: "A",
    answerZh: "A",
    answerVi: "A",
    scoring: "auto",
    answerSource: "source_answer",
    explanationVi: "",
   },
   created_at: "2026-08-14T00:00:00Z",
   updated_at: "2026-08-14T00:00:00Z",
  });
  expect(readerExerciseItemRowSchema.safeParse(row).success).toBe(true);
  expect(parseReaderExerciseItemRow(row).payload.answer).toBe("A");
  expect(() => parseReaderExerciseItemRow({ ...row, item_type: "true_false" })).toThrow();
 });

 it("requires a valid paragraph or PDF asset annotation target and range", () => {
  const result = readerAnnotationRowSchema.safeParse({
   id: "550e8400-e29b-41d4-a716-446655440000",
   user_id: "550e8400-e29b-41d4-a716-446655440001",
   document_id: "document-1",
   paragraph_id: "paragraph-1",
   asset_id: null,
   annotation_type: "highlight",
   page_number: null,
   start_offset: 2,
   end_offset: 8,
   selected_text: "绍兴",
   note_text: "",
   color: "yellow",
   payload: {},
   revision: 0,
   created_at: "2026-08-14T00:00:00Z",
   updated_at: "2026-08-14T00:00:00Z",
   deleted_at: null,
  });
  expect(result.success).toBe(true);
  if (!result.success) throw new Error("Expected a valid Reader annotation row.");
  expect(readerAnnotationRowSchema.safeParse({ ...result.data, end_offset: 1 }).success).toBe(
   false,
  );
 });

 it("keeps Reader progress answers typed per item", () => {
  const row = readerProgressRowSchema.safeParse({
   user_id: "550e8400-e29b-41d4-a716-446655440001",
   document_id: "document-1",
   show_pinyin: true,
   show_meaning: false,
   completed: false,
   summary_text: "",
   answers: {
    "item-1": { answer: "A", score: 1, completed: true, responseMs: 5000 },
   },
   revision: 1,
   created_at: "2026-08-14T00:00:00Z",
   updated_at: "2026-08-14T00:00:00Z",
  });
  expect(row.success).toBe(true);
  if (!row.success) throw new Error("Expected a valid Reader progress row.");
  expect(row.data).not.toHaveProperty("show_pinyin");
  expect(row.data).not.toHaveProperty("show_meaning");
  expect(row.data).not.toHaveProperty("summary_text");
  expect(
   readerProgressRowSchema.safeParse({
    ...row.data,
    answers: { "item-1": { answer: "A" } },
   }).success,
  ).toBe(false);
 });

 it("accepts local HanziHome resource URLs with checksummed rights metadata", () => {
  expect(
   readerAssetRowSchema.safeParse({
    id: "asset-1",
    document_id: null,
    source: "seed",
    asset_type: "pdf",
    source_path: "public/resources/reader.pdf",
    sha256: "a".repeat(64),
    storage_bucket: null,
    storage_path: null,
    external_url: "/resources/reader.pdf",
    mime_type: "application/pdf",
    rights_status: "licensed",
    redistribution_allowed: true,
    metadata: { source: "hanzi-studio" },
    created_at: "2026-08-14T00:00:00Z",
    updated_at: "2026-08-14T00:00:00Z",
   }).success,
  ).toBe(true);
 });
});
