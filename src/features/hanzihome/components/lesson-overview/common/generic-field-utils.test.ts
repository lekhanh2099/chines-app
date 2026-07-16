import { describe, expect, it } from "vitest";

import { getRenderableFields } from "./generic-field-utils";

describe("getRenderableFields", () => {
 it("never exposes Boya import metadata in Study Mode cards", () => {
  const fields = getRenderableFields({
   id: "boya-intermediate-2-l01-src-005-q01",
   prompt: "我的词汇量不够,你有什么记生词的好 ( )?",
   source_ref: "boya-intermediate-2-l01-p06",
   source_page: 6,
   source_pages: [{ pdfPage: 24, printedPage: 6 }],
   source_assets: ["assets/boya-intermediate-2/textbook/page-024.webp"],
   answer_origin: "manual",
   transcription_status: "source_visual_required",
   requires_source_visual: true,
  });

  expect(fields).toEqual([
   {
    key: "prompt",
    label: "Câu hỏi",
    value: "我的词汇量不够,你有什么记生词的好 ( )?",
   },
  ]);
 });
});
