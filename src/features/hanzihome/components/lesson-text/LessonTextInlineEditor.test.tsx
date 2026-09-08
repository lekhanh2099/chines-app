import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HanziHomeFeatureProvider } from "@/features/hanzihome/context/HanziHomeFeatureProvider";
import type { LessonModuleFrame } from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import type { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import type { ReaderSurface } from "@/features/hanzihome/reader/components/ReaderSurface";
import type { TextbookSectionCard } from "./TextbookSectionCard";
import { HanyuLessonSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

const { frameMock, readerMock, sectionCardMock } = vi.hoisted(() => ({
 frameMock: vi.fn<(props: ComponentProps<typeof LessonModuleFrame>) => void>(),
 readerMock: vi.fn<(props: ComponentProps<typeof ReaderSurface>) => void>(),
 sectionCardMock: vi.fn<(props: ComponentProps<typeof TextbookSectionCard>) => void>(),
}));

vi.mock("@/features/hanzihome/hooks/useHanziHomeLessonResources", () => ({
 useHanziHomeLessonSections: () => null,
}));
vi.mock("@/features/hanzihome/components/lesson-overview/LessonModuleFrame", () => ({
 LessonModuleFrame: (props: ComponentProps<typeof LessonModuleFrame>) => {
  frameMock(props);
  return (
   <>
    {props.sidebar}
    {props.children}
   </>
  );
 },
 LessonModuleSidebarRailItem: () => null,
}));
vi.mock("@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem", () => ({
 LessonModuleSidebarItem: (props: ComponentProps<typeof LessonModuleSidebarItem>) => (
  <button type="button" aria-pressed={props.selected} onClick={props.onClick}>
   {props.title}
  </button>
 ),
}));
vi.mock("@/features/hanzihome/reader/components/ReaderSurface", () => ({
 ReaderSurface: (props: ComponentProps<typeof ReaderSurface>) => {
  readerMock(props);
  return props.document.segments.map((segment) => <p key={segment.id}>{segment.zh}</p>);
 },
}));
vi.mock("./TextbookSectionCard", () => ({
 TextbookSectionCard: (props: ComponentProps<typeof TextbookSectionCard>) => {
  sectionCardMock(props);
  return <article>{props.section.title_vi}</article>;
 },
}));
vi.mock("@/features/hanzihome/annotations/LessonAnnotationProvider", () => ({
 LessonAnnotationProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/features/hanzihome/components/LessonOverview", () => ({
 LessonOverview: () => <p>Lesson overview</p>,
}));
vi.mock("@/features/hanzihome/components/vocab/VocabWorkspace", () => ({
 VocabWorkspace: () => <p>Vocabulary workspace</p>,
}));
vi.mock("@/features/hanzihome/components/grammar/GrammarWorkspace", () => ({
 GrammarWorkspace: () => <p>Grammar workspace</p>,
}));
vi.mock("@/features/hanzihome/components/notes/LessonNoteAccessCard", () => ({
 LessonNoteAccessCard: () => <p>Personal notes</p>,
}));
vi.mock("@/features/hanzihome/components/review/ReviewWorkspace", () => ({
 ReviewWorkspace: () => null,
}));
vi.mock("@/features/hanzihome/practice/PracticeWorkspace", () => ({
 PracticeWorkspace: () => null,
}));
vi.mock("@/features/hanzihome/listening/ListeningWorkspace", () => ({
 ListeningWorkspace: () => null,
}));
vi.mock("@/features/hanzihome/listening/ListeningDictationWorkspace", () => ({
 ListeningDictationWorkspace: () => null,
}));

import { LessonTextInlineEditor } from "./LessonTextInlineEditor";
import { LessonModuleContent } from "../modules/LessonModuleContent";
import type { StudyModule } from "../../context/types";

const sourceLesson = HanyuLessonSchema.parse({
 lesson: {
  id: "hanyu-q3-lesson-7",
  title: { zh: "成语故事", vi: "Câu chuyện thành ngữ" },
  sections: [
   {
    id: "text-second",
    type: "text",
    order: 11,
    title: "课文二",
    title_vi: "Bài khóa thứ hai",
    blocks: [
     {
      id: "narrative-second",
      type: "text_narrative",
      order: 1,
      title: "自相矛盾",
      paragraphs: [{ id: "paragraph-second", order: 1, zh: "有一个卖矛和盾的人。" }],
     },
    ],
   },
   {
    id: "vocabulary",
    type: "vocabulary",
    order: 2,
    title: "生词",
    title_vi: "Từ vựng",
    items: [],
   },
   {
    id: "proper-nouns",
    type: "proper_nouns",
    order: 3,
    title: "专名",
    title_vi: "Tên riêng",
    items: [],
   },
   { id: "notes", type: "notes", order: 4, title: "注释", title_vi: "Chú thích", items: [] },
   { id: "grammar", type: "grammar", order: 5, title: "语法", title_vi: "Ngữ pháp", items: [] },
   { id: "exercises", type: "exercises", order: 6, title: "练习", title_vi: "Bài tập", items: [] },
   { id: "reading", type: "reading", order: 7, title: "阅读", title_vi: "Đọc hiểu", items: [] },
   {
    id: "writing",
    type: "character_writing",
    order: 8,
    title: "写汉字",
    title_vi: "Viết chữ Hán",
    items: [],
   },
   { id: "summary", type: "summary", order: 9, title: "总结", title_vi: "Tổng kết", items: [] },
   {
    id: "communication",
    type: "communication",
    order: 10,
    title: "交际",
    title_vi: "Giao tiếp",
    items: [],
   },
   {
    id: "text-first",
    type: "text",
    order: 1,
    title: "课文一",
    title_vi: "Bài khóa thứ nhất",
    blocks: [
     {
      id: "narrative-first",
      type: "text_narrative",
      order: 1,
      title: "滥竽充数",
      paragraphs: [{ id: "paragraph-first", order: 1, zh: "中国古代有一种乐器。" }],
     },
    ],
   },
  ],
 },
});

const lesson: HanziHomeLesson = {
 id: sourceLesson.lesson.id,
 lessonNumber: 7,
 titleZh: "成语故事",
 title: "Câu chuyện thành ngữ",
 vocabIds: [],
 grammarPointIds: [],
 vocab: [],
 grammar: [],
 sourceLesson,
};

function renderWorkspace(element: ReactNode) {
 return renderToStaticMarkup(
  <HanziHomeFeatureProvider
   readOnly={false}
   lesson={lesson}
   learningState={{
    settings: {},
    progress: { vocab: {}, grammar: {} },
    bookmarks: { lessons: [], vocab: [], grammar: [], radicals: [] },
    reviewHistory: [],
   }}
   activeModule="lessonText"
   onSelectModule={vi.fn()}
   onUpdateLearningSettings={vi.fn()}
   onBookmarkVocab={vi.fn()}
   onMarkVocab={vi.fn()}
   onBookmarkGrammar={vi.fn()}
   onMarkGrammar={vi.fn()}
   onAnswerReview={vi.fn()}
  >
   {element}
  </HanziHomeFeatureProvider>,
 );
}

beforeEach(() => vi.clearAllMocks());

describe("LessonTextInlineEditor module filtering", () => {
 const supplementCases = [
  { module: "vocab", sectionId: "proper-nouns", owner: "Vocabulary workspace", sourceIndex: 2 },
  { module: "notes", sectionId: "notes", owner: "Personal notes", sourceIndex: 3 },
  { module: "overview", sectionId: "summary", owner: "Lesson overview", sourceIndex: 8 },
 ] satisfies Array<{ module: StudyModule; sectionId: string; owner: string; sourceIndex: number }>;

 it.each(supplementCases)(
  "keeps $sectionId accessible in $module without replacing its owner",
  ({ module, sectionId, owner, sourceIndex }) => {
   const markup = renderWorkspace(
    <LessonModuleContent
     module={module}
     lessonTextSelectedSectionId="__all_lesson_sections__"
     onSelectLessonTextSection={vi.fn()}
    />,
   );
   expect(markup).toContain(owner);
   expect(sectionCardMock).toHaveBeenCalledOnce();
   expect(sectionCardMock.mock.calls[0]?.[0].section).toBe(
    sourceLesson.lesson.sections[sourceIndex],
   );
   expect(sectionCardMock.mock.calls[0]?.[0]).toMatchObject({
    lessonId: lesson.id,
    section: { id: sectionId },
    sectionPath: ["lesson", "sections", sourceIndex],
   });
  },
 );

 it("lists only ordered text sections in Bài khóa and renders one shared reader", () => {
  const markup = renderWorkspace(
   <LessonTextInlineEditor selectedSectionId="__all_lesson_sections__" onSelectSection={vi.fn()} />,
  );

  expect(frameMock.mock.calls[0]?.[0]).toMatchObject({
   compact: true,
   showMobileHeader: false,
   sidebar: null,
   sidebarRail: null,
  });
  expect(frameMock.mock.calls[0]?.[0].mobileNavigation).toBeUndefined();
  for (const title of ["Từ vựng", "Tên riêng", "Chú thích", "Ngữ pháp", "Tổng kết", "Đọc hiểu"]) {
   expect(markup).not.toContain(title);
  }
  expect(readerMock).toHaveBeenCalledOnce();
  expect(readerMock.mock.calls[0]?.[0].document.segments.map((segment) => segment.id)).toEqual([
   "paragraph-first",
   "paragraph-second",
  ]);
  expect(sectionCardMock).not.toHaveBeenCalled();
 });

 it("keeps all four practice section families out of the lesson reader", () => {
  renderWorkspace(
   <LessonTextInlineEditor
    practiceOnly
    selectedSectionId="__all_lesson_sections__"
    onSelectSection={vi.fn()}
   />,
  );

  expect(frameMock.mock.calls[0]?.[0].mobileNavigation?.items.map((item) => item.value)).toEqual([
   "__all_lesson_sections__",
   "exercises",
   "reading",
   "writing",
   "communication",
  ]);
  expect(sectionCardMock.mock.calls.map(([props]) => props.section.id)).toEqual([
   "exercises",
   "reading",
   "writing",
   "communication",
  ]);
  expect(readerMock).not.toHaveBeenCalled();
 });

 it.each(["proper-nouns", "removed-section"])(
  "falls back to all text sections when the selected ID %s is outside Bài khóa",
  (selectedSectionId) => {
   renderWorkspace(
    <LessonTextInlineEditor selectedSectionId={selectedSectionId} onSelectSection={vi.fn()} />,
   );

   expect(frameMock.mock.calls[0]?.[0].mobileNavigation).toBeUndefined();
   expect(readerMock).toHaveBeenCalledOnce();
   expect(readerMock.mock.calls[0]?.[0].document.segments.map((segment) => segment.id)).toEqual([
    "paragraph-first",
    "paragraph-second",
   ]);
   expect(sectionCardMock).not.toHaveBeenCalled();
  },
 );
});
