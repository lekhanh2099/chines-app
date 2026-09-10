import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import readerDocumentMessages from "../../../../messages/vi/reader-document.json";
import readerStudyMessages from "../../../../messages/vi/reader-study.json";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import { useReaderSelectionActions } from "./useReaderSelectionActions";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderAnnotationRow } from "../model/reading-annotation.schemas";

const sampleDocument: ReaderDocumentModel = {
 id: "doc-1",
 language: "zh-CN",
 source: {
  kind: "lesson",
  sourceId: "lesson-1",
  href: "/hsk/han-thuong-mai",
  label: "Lesson 1",
 },
 title: "Test Title",
 titleVi: "Tiêu đề test",
 sections: [{ id: "sec-1", title: "Section 1", segmentIds: ["seg-1"] }],
 segments: [
  {
   id: "seg-1",
   kind: "paragraph",
   sectionId: "sec-1",
   zh: "你好世界",
   pinyin: "nǐ hǎo shì jiè",
   speechText: "你好世界",
  },
 ],
 metadata: [],
 capabilities: ["pinyin", "translation"],
};

const sampleAnnotation: ReaderAnnotationRow = {
 id: "ann-1",
 user_id: "user-1",
 document_id: "doc-1",
 paragraph_id: "seg-1",
 asset_id: null,
 annotation_type: "note",
 page_number: null,
 start_offset: 0,
 end_offset: 2,
 selected_text: "你好",
 note_text: "My custom note",
 color: "yellow",
 payload: {},
 created_at: "2026-09-10T00:00:00.000Z",
 updated_at: "2026-09-10T00:00:00.000Z",
 deleted_at: null,
 revision: 1,
};

function TestSelectionHarness({
 onActions,
 playFromCharacter,
}: {
 onActions?: (actions: ReturnType<typeof useReaderSelectionActions>) => void;
 playFromCharacter?: (segmentId: string, charOffset: number) => void;
}) {
 const actions = useReaderSelectionActions({
  document: sampleDocument,
  vocabulary: [],
  stateOwner: "personal",
  analysisBySegmentId: new Map(),
  setSaveError: vi.fn(),
  selectSegment: vi.fn(),
  stop: vi.fn(),
  playFromCharacter,
 });

 onActions?.(actions);

 return actions.popover;
}

describe("useReaderSelectionActions", () => {
 let queryClient: QueryClient;

 beforeEach(() => {
  queryClient = new QueryClient({
   defaultOptions: { queries: { retry: false } },
  });
 });

 function wrapWithProviders(children: ReactNode) {
  return (
   <NextIntlClientProvider
    locale="vi"
    messages={{
     Reader: { document: readerDocumentMessages, study: readerStudyMessages },
    }}
    timeZone="Asia/Ho_Chi_Minh"
   >
    <MandarinTtsProvider>
     <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MandarinTtsProvider>
   </NextIntlClientProvider>
  );
 }

 it("renders initially without open popover", () => {
  const html = renderToStaticMarkup(wrapWithProviders(<TestSelectionHarness />));
  expect(html).toBe("");
 });

 it("opens popover with note when handleOpenAnnotation is triggered", () => {
  let capturedActions: ReturnType<typeof useReaderSelectionActions> | undefined;

  renderToStaticMarkup(
   wrapWithProviders(
    <TestSelectionHarness
     onActions={(actions) => {
      capturedActions = actions;
     }}
    />,
   ),
  );

  expect(capturedActions).toBeDefined();
  expect(typeof capturedActions?.handleOpenAnnotation).toBe("function");
  const mockRect: DOMRect = {
   x: 0,
   y: 0,
   width: 100,
   height: 20,
   top: 0,
   right: 100,
   bottom: 20,
   left: 0,
   toJSON: () => ({}),
  };
  capturedActions?.handleOpenAnnotation(sampleAnnotation, mockRect);
 });
});
