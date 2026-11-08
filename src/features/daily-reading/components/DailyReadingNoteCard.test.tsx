import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
 dailyReadingSchema,
 type DailyReading,
} from "@/features/daily-reading/model/daily-reading.schemas";

const sampleReading: DailyReading = dailyReadingSchema.parse({
 schemaVersion: "2.0.0",
 id: "sample-reading-note-1",
 publishedDate: "2026-11-05",
 capturedAt: "2026-11-05T12:00:00.000Z",
 releaseKind: "manual",
 provenance: "source-captured",
 estimatedMinutes: 4,
 source: {
  url: "https://example.com/tech-article",
  publisher: "China News",
  titleZh: "中越人工智能与数字经济合作前景广阔",
  publishedAt: "2026-11-05T10:00:00.000Z",
  capturedAt: "2026-11-05T12:00:00.000Z",
 },
 article: {
  fingerprint: "1234abcd",
  titleZh: "中越人工智能与数字经济合作前景广阔",
  hanCharacterCount: 80,
  paragraphs: [
   {
    id: "p1",
    order: 1,
    zh: "在数字经济蓬勃发展的背景下，中越两国科技创新合作持续深化。",
   },
   {
    id: "p2",
    order: 2,
    zh: "双方共同推动人工智能、跨境电商等重点领域的经贸与技术交流。",
   },
   {
    id: "p3",
    order: 3,
    zh: "两国青年人才正在数字技术与创业就业领域开展广泛合作。",
   },
  ],
 },
 classification: {
  targetLevel: "HSK4",
  topic: "science",
  estimatedLevel: null,
 },
 enrichment: {
  translation: {
   status: "ready",
   updatedAt: "2026-11-05T12:05:00.000Z",
   generatedBy: null,
   data: {
    titleVi: "Triển vọng hợp tác trí tuệ nhân tạo và kinh tế số Việt - Trung rộng mở",
    whyWorthReadingVi: "Từ vựng công nghệ và kinh tế số.",
    adaptationNoticeVi: "",
    paragraphs: [
     {
      paragraphId: "p1",
      vi: "Trong bối cảnh kinh tế số phát triển mạnh mẽ, hợp tác đổi mới công nghệ hai nước tiếp tục đi vào chiều sâu.",
      roleVi: "main",
     },
     {
      paragraphId: "p2",
      vi: "Hai bên cùng thúc đẩy giao lưu công nghệ và thương mại trong các lĩnh vực trọng điểm như AI và thương mại điện tử xuyên biên giới.",
      roleVi: "main",
     },
     {
      paragraphId: "p3",
      vi: "Nhân tài trẻ hai nước đang hợp tác sâu rộng trong công nghệ số và việc làm khởi nghiệp.",
      roleVi: "main",
     },
    ],
   },
  },
  vocabulary: {
   status: "ready",
   updatedAt: "2026-11-05T12:05:00.000Z",
   generatedBy: null,
   data: {
    items: [
     {
      id: "v1",
      order: 1,
      hanzi: "人工智能",
      meaningVi: "trí tuệ nhân tạo",
      meaningInContextVi: "trí tuệ nhân tạo",
      categoryVi: "Công nghệ",
     },
    ],
   },
  },
  grammar: {
   status: "idle",
  },
  questions: {
   status: "idle",
  },
 },
});

let mockNoteData: { id: string } | null = null;
let mockIsLoading = false;

vi.mock("@/features/notes/hooks/useLessonLinkedNote", () => ({
 useLessonLinkedNote: () => ({
  data: mockNoteData,
  isLoading: mockIsLoading,
 }),
}));

vi.mock("@/features/notes/hooks/useCreateLessonLinkedNote", () => ({
 useCreateLessonLinkedNote: () => ({
  mutate: vi.fn(),
  isPending: false,
 }),
}));

vi.mock("@/features/hanzihome/components/notes/LessonSplitNoteEditor", () => ({
 LessonSplitNoteEditor: ({ noteId }: { noteId: string }) => (
  <div data-testid="split-note-editor">Editor for note {noteId}</div>
 ),
}));

vi.mock("@/features/hanzihome/components/LinkedContentSkeleton", () => ({
 LinkedContentSkeleton: ({ label }: { label: string }) => <div>{label}</div>,
}));

import {
 DailyReadingNoteCard,
 createDailyReadingReadingContent,
 createDailyReadingPersonalNoteContent,
} from "./DailyReadingNoteCard";

describe("DailyReadingNoteCard", () => {
 it("generates valid initial lexical content structures for reading and note", () => {
  const readingContent = createDailyReadingReadingContent(sampleReading);
  const noteContent = createDailyReadingPersonalNoteContent(sampleReading);

  expect(readingContent.root).toBeDefined();
  expect(noteContent.root).toBeDefined();
 });

 it("renders create note CTA button when no linked note exists", () => {
  mockNoteData = null;
  mockIsLoading = false;

  const markup = renderToStaticMarkup(<DailyReadingNoteCard reading={sampleReading} />);

  expect(markup).toContain("Chưa có ghi chú cho bài đọc này");
  expect(markup).toContain("Tạo ghi chú cho bài đọc này");
 });

 it("renders LessonSplitNoteEditor when linked note exists", () => {
  mockNoteData = { id: "test-note-id-123" };
  mockIsLoading = false;

  const markup = renderToStaticMarkup(<DailyReadingNoteCard reading={sampleReading} />);

  expect(markup).toContain("Editor for note test-note-id-123");
 });

 it("renders skeleton when loading", () => {
  mockNoteData = null;
  mockIsLoading = true;

  const markup = renderToStaticMarkup(<DailyReadingNoteCard reading={sampleReading} />);

  expect(markup).toContain("Đang kiểm tra ghi chú của bài đọc...");
 });
});
