import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import type { Database } from "@/types/supabase.generated";
import * as textbookContent from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { ReaderAnnotationInput } from "@/features/reading/services/reading-annotation-api";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import { buildBusinessChineseReaderDocument } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";

const { createServiceRoleSupabaseClient } = vi.hoisted(() => ({
 createServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service-role.server", () => ({ createServiceRoleSupabaseClient }));

import {
 createReaderAnnotation,
 deleteReaderAnnotation,
 listReaderAnnotations,
 updateReaderAnnotation,
} from "@/features/reading/repositories/reading-annotation.repository";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/reading/repositories/reading-content.repository";

const userId = "98321546-f73c-44d9-8077-25ff5a563c79";
const annotationId = "af84c8d0-aa7f-4af7-a4b7-71ff6e887a35";
const now = "2026-09-06T00:00:00.000Z";
const context: AuthenticatedRouteContext = {
 supabase: createClient<Database>("https://example.supabase.co", "test-key", {
  auth: { autoRefreshToken: false, persistSession: false },
 }),
 user: {
  id: userId,
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: now,
 },
};

function textbookInput(bookKey: textbookContent.TextbookLesson["bookKey"]): ReaderAnnotationInput {
 const lesson = textbookContent.getTextbookLesson(bookKey, 1);
 if (!lesson) throw new Error("Missing textbook fixture");
 const document = buildBusinessChineseReaderDocument(lesson, "text");
 const segment = document.segments[0];
 if (!segment) throw new Error("Missing textbook paragraph");
 return {
  documentId: document.id,
  paragraphId: segment.id,
  assetId: null,
  annotationType: "note",
  pageNumber: null,
  startOffset: 0,
  endOffset: segment.zh.length,
  selectedText: segment.zh,
  noteText: "Ghi chú đã lưu",
  color: "yellow",
  payload: {},
 };
}

function annotationRow(input: ReaderAnnotationInput): ReaderAnnotationRow {
 return {
  id: annotationId,
  user_id: userId,
  document_id: input.documentId,
  paragraph_id: input.paragraphId,
  asset_id: input.assetId,
  annotation_type: input.annotationType,
  page_number: input.pageNumber,
  start_offset: input.startOffset,
  end_offset: input.endOffset,
  selected_text: input.selectedText,
  note_text: input.noteText,
  color: input.color,
  payload: input.payload,
  revision: 0,
  created_at: now,
  updated_at: now,
  deleted_at: null,
 };
}

describe("Reader annotations on static textbooks", () => {
 beforeEach(() => {
  vi.restoreAllMocks();
  createServiceRoleSupabaseClient.mockReset();
 });

 it.each(textbookContent.getTextbookCatalog())(
  "saves a real canonical paragraph in $label under the authenticated owner",
  async (book) => {
   const input = textbookInput(book.key);
   const row = annotationRow(input);
   const single = vi.fn().mockResolvedValue({ data: row, error: null });
   const select = vi.fn().mockReturnValue({ single });
   const insert = vi.fn().mockReturnValue({ select });
   const from = vi.fn().mockReturnValue({ insert });
   createServiceRoleSupabaseClient.mockReturnValue({ from });

   await expect(createReaderAnnotation(input, context)).resolves.toEqual(row);
   expect(from).toHaveBeenCalledWith("hanzihome_reader_annotations");
   expect(insert).toHaveBeenCalledWith({
    user_id: userId,
    document_id: input.documentId,
    paragraph_id: input.paragraphId,
    asset_id: null,
    annotation_type: "note",
    page_number: null,
    start_offset: input.startOffset,
    end_offset: input.endOffset,
    selected_text: input.selectedText,
    note_text: input.noteText,
    color: "yellow",
    payload: {},
   });
  },
 );

 it("lists only the current owner's nondeleted annotations for the canonical text document", async () => {
  const input = textbookInput("doc-hieu");
  const row = annotationRow(input);
  const query = {
   eq: vi.fn(),
   is: vi.fn(),
   order: vi.fn().mockResolvedValue({ data: [row], error: null }),
  };
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  const select = vi.fn().mockReturnValue(query);
  createServiceRoleSupabaseClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) });

  await expect(listReaderAnnotations(input.documentId, context)).resolves.toEqual([row]);
  expect(query.eq).toHaveBeenCalledWith("user_id", userId);
  expect(query.eq).toHaveBeenCalledWith("document_id", input.documentId);
  expect(query.is).toHaveBeenCalledWith("deleted_at", null);
 });

 it("rejects arbitrary documents, view aliases, and paragraphs from another book before a write", async () => {
  const input = textbookInput("doc-hieu");
  const other = textbookInput("nhip-cau");
  for (const documentId of ["arbitrary:text", input.documentId.replace(/:text$/u, ":all")]) {
   await expect(createReaderAnnotation({ ...input, documentId }, context)).rejects.toThrow(
    "Reader document is not in the static package",
   );
  }
  await expect(
   createReaderAnnotation({ ...input, paragraphId: other.paragraphId }, context),
  ).rejects.toThrow("Reader paragraph is not in the document");
  expect(createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("rejects stale text, invalid ranges and asset targets for a textbook", async () => {
  const input = textbookInput("tm2");
  const invalidInputs: ReaderAnnotationInput[] = [
   { ...input, selectedText: "不是原文" },
   { ...input, startOffset: null, endOffset: null },
   { ...input, startOffset: 2, endOffset: 1 },
   { ...input, startOffset: 0, endOffset: input.selectedText.length + 1 },
  ];
  for (const invalid of invalidInputs) {
   await expect(createReaderAnnotation(invalid, context)).rejects.toThrow(
    "Reader annotation range is invalid",
   );
  }
  await expect(
   createReaderAnnotation({ ...input, paragraphId: null, assetId: "asset-1" }, context),
  ).rejects.toThrow("Reader asset is not in the document");
  expect(createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("uses UTF-16 grapheme boundaries like selection, including supplementary Hanzi and emoji", async () => {
  const lesson = textbookContent.getTextbookLesson("doc-hieu", 1);
  if (!lesson) throw new Error("Missing textbook fixture");
  vi.spyOn(textbookContent, "getTextbookLesson").mockReturnValue({
   ...lesson,
   sections: [
    {
     id: "unicode-section",
     title: "Bài đọc",
     category: "text",
     blocks: [
      {
       id: "unicode-paragraph",
       type: "paragraph",
       text: "😀𠮷重庆。",
       translation: "Trùng Khánh.",
       rows: [],
      },
     ],
    },
   ],
  });
  const input: ReaderAnnotationInput = {
   ...textbookInput("doc-hieu"),
   startOffset: 2,
   endOffset: 6,
   selectedText: "𠮷重庆",
  };
  const row = annotationRow(input);
  const single = vi.fn().mockResolvedValue({ data: row, error: null });
  const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
  createServiceRoleSupabaseClient.mockReturnValue({ from: vi.fn().mockReturnValue({ insert }) });

  await expect(createReaderAnnotation(input, context)).resolves.toEqual(row);
  await expect(
   createReaderAnnotation({ ...input, startOffset: 3, selectedText: "\uDFB7重庆" }, context),
  ).rejects.toThrow("Reader annotation range is invalid");
  expect(insert).toHaveBeenCalledOnce();
 });

 it.each(["success", "stale", "concurrent"])(
  "preserves nullable targets and owner/revision checks: %s",
  async (scenario) => {
   const input = textbookInput("nhip-cau");
   const row = annotationRow(input);
   const query = {
    eq: vi.fn(),
    is: vi.fn(),
    maybeSingle: vi
     .fn()
     .mockResolvedValueOnce({ data: row, error: null })
     .mockResolvedValueOnce({
      data: scenario === "concurrent" ? null : { ...row, revision: 1 },
      error: null,
     })
     .mockResolvedValue({ data: { ...row, revision: 1 }, error: null }),
    select: vi.fn(),
   };
   query.eq.mockReturnValue(query);
   query.is.mockReturnValue(query);
   query.select.mockReturnValue(query);
   const write = vi.fn().mockReturnValue(query);
   const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
   createServiceRoleSupabaseClient.mockReturnValue({
    from: vi.fn().mockReturnValue({ select: query.select, update: write }),
    rpc,
   });
   const update: Parameters<typeof updateReaderAnnotation>[0] = {
    annotationId,
    assetId: null,
    color: input.color,
    endOffset: input.endOffset,
    expectedRevision: scenario === "stale" ? 1 : 0,
    noteText: "Nội dung cập nhật",
    pageNumber: null,
    payload: {},
    paragraphId: input.paragraphId,
    selectedText: input.selectedText,
    startOffset: input.startOffset,
   };

   if (scenario !== "success") {
    await expect(updateReaderAnnotation(update, context)).rejects.toThrow(
     "Reader annotation changed since it was loaded",
    );
    if (scenario === "stale") expect(write).not.toHaveBeenCalled();
    else expect(query.eq).toHaveBeenCalledWith("revision", 0);
    expect(rpc).not.toHaveBeenCalled();
    return;
   }
   await expect(updateReaderAnnotation(update, context)).resolves.toEqual({ ...row, revision: 1 });
   await expect(
    deleteReaderAnnotation({ annotationId, expectedRevision: 1 }, context),
   ).resolves.toBe(true);
   expect(query.eq).toHaveBeenCalledWith("id", annotationId);
   expect(query.eq).toHaveBeenCalledWith("user_id", userId);
   expect(query.is).toHaveBeenCalledWith("deleted_at", null);
   expect(query.eq).toHaveBeenCalledWith("revision", 0);
   expect(write).toHaveBeenCalledWith({
    asset_id: null,
    color: input.color,
    end_offset: input.endOffset,
    note_text: "Nội dung cập nhật",
    page_number: null,
    payload: {},
    paragraph_id: input.paragraphId,
    selected_text: input.selectedText,
    start_offset: input.startOffset,
    revision: 1,
   });
   expect(rpc).toHaveBeenCalledExactlyOnceWith("hanzihome_delete_reader_annotation_as_server", {
    p_user_id: userId,
    p_annotation_id: annotationId,
    p_expected_revision: 1,
   });
  },
 );

 it("does not call revision RPCs when the annotation is absent for the owner", async () => {
  const query = {
   eq: vi.fn(),
   is: vi.fn(),
   maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  const rpc = vi.fn();
  createServiceRoleSupabaseClient.mockReturnValue({
   from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(query) }),
   rpc,
  });
  await expect(
   deleteReaderAnnotation({ annotationId, expectedRevision: 0 }, context),
  ).rejects.toThrow("Reader annotation not found");
  expect(query.eq).toHaveBeenCalledWith("user_id", userId);
  expect(rpc).not.toHaveBeenCalled();
 });

 it("keeps original static Reader document annotations supported", async () => {
  const documents = await listReaderDocuments();
  const document = documents[0];
  if (!document) throw new Error("Missing Reader fixture");
  const resource = await getReaderDocument(document.id);
  const paragraph = resource?.paragraphs[0];
  if (!paragraph) throw new Error("Missing Reader paragraph");
  const input: ReaderAnnotationInput = {
   ...textbookInput("doc-hieu"),
   documentId: document.id,
   paragraphId: paragraph.id,
   startOffset: null,
   endOffset: null,
   selectedText: paragraph.zh,
  };
  const row = annotationRow(input);
  const single = vi.fn().mockResolvedValue({ data: row, error: null });
  const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
  createServiceRoleSupabaseClient.mockReturnValue({ from: vi.fn().mockReturnValue({ insert }) });

  await expect(createReaderAnnotation(input, context)).resolves.toEqual(row);
 });
});
