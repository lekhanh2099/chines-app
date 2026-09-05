import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import businessChineseMessages from "../../../../../messages/vi/business-chinese.json";
import readerDocumentMessages from "../../../../../messages/vi/reader-document.json";
import readerStudyMessages from "../../../../../messages/vi/reader-study.json";
import type { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { ReaderDocumentModel } from "@/features/hanzihome/reader/model/reader-document.types";
import {
 getBusinessChineseCatalog,
 getBusinessChineseLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

type SidebarItemProps = ComponentProps<typeof LessonModuleSidebarItem>;

const routerPushMock = vi.hoisted(() => vi.fn());
const sidebarItemMock = vi.hoisted(() => vi.fn<(props: SidebarItemProps) => void>());
const readerDocumentMock = vi.hoisted(() => vi.fn<(document: ReaderDocumentModel) => void>());

vi.mock("@/features/hanzihome/reader/components/ReaderSurface", async (importOriginal) => {
 const actual =
  await importOriginal<typeof import("@/features/hanzihome/reader/components/ReaderSurface")>();
 return {
  ...actual,
  ReaderSurface: (props: ComponentProps<typeof actual.ReaderSurface>) => {
   readerDocumentMock(props.document);
   return <actual.ReaderSurface {...props} />;
  },
 };
});

vi.mock("@/features/dictionary/hooks/useVocabInspector", () => ({
 useVocabInspector: () => ({ openInspector: vi.fn() }),
}));
vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => ({
  state: { settings: { lessonTextDisplayMode: DEFAULT_LESSON_DISPLAY_MODE } },
 }),
}));

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
 useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("@/features/hanzihome/annotations/LessonAnnotationProvider", () => ({
 useLessonAnnotationContext: () => null,
}));

vi.mock("@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem", () => ({
 LessonModuleSidebarItem: (props: SidebarItemProps) => {
  sidebarItemMock(props);
  return <button type="button">{props.title}</button>;
 },
}));

vi.mock("@/features/hanzihome/reader/components/ReaderTools", async (importOriginal) => ({
 ...(await importOriginal<typeof import("@/features/hanzihome/reader/components/ReaderTools")>()),
 ReaderTools: () => <button type="button">Công cụ học</button>,
}));

import { BusinessChineseStudyWorkspace } from "./BusinessChineseStudyWorkspace";

function renderWorkspace(element: ReactNode) {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{
    BusinessChinese: businessChineseMessages,
    Reader: { document: readerDocumentMessages, study: readerStudyMessages },
   }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   {element}
  </NextIntlClientProvider>,
 );
}

describe("BusinessChineseStudyWorkspace", () => {
 it("renders the ordered source document with tabs, ruby pinyin, and no connected content load", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 2);
  if (!lesson) throw new Error("Expected Business Chinese lesson 2.");
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  const markup = renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson} />);

  expect(markup).toContain("Toàn bài");
  expect(markup).toContain("Câu chủ đề");
  expect(markup).toContain("Bài tập");
  expect(markup).toContain("GIỚI THIỆU TỔNG QUAN");
  expect(markup).toContain("BÀI KHÓA CHÍNH");
  expect(markup).toContain("电话会议");
  expect(markup).toContain("Đoạn 1 /");
  expect(markup).toContain("Nghe bài");
  expect(markup).toContain("Công cụ học");
  expect(markup.includes(`aria-label="${businessChineseMessages.tabsLabel}"`)).toBe(true);
  expect(markup).not.toContain("lucide-panel-left-open");
  expect(markup).toContain("<ruby");
  expect(markup).toContain('lang="zh-CN"');
  expect(markup).toContain('lang="zh-Latn-pinyin"');
  expect(markup).toContain('aria-label="Đọc tiếng Trung:');
  expect(markup).not.toContain("Vậy là tôi đã xuất");
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
 });

 it("keeps inline exercise answers hidden while preserving pinyin and TTS for the prompt", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 2);
  if (!lesson) throw new Error("Expected Business Chinese lesson 2.");
  const sourceSection = lesson.sections.find((section) =>
   section.blocks.some((block) => block.text.startsWith("这个设计图 ______")),
  );
  const sourceBlock = sourceSection?.blocks.find((block) =>
   block.text.startsWith("这个设计图 ______"),
  );
  if (!sourceSection || !sourceBlock) throw new Error("Expected the representative exercise.");
  const focusedLesson = {
   ...lesson,
   sections: [{ ...sourceSection, blocks: [sourceBlock] }],
  };

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={books} lesson={focusedLesson} />,
  );

  expect(markup).not.toContain("这个设计图画得很漂亮。");
  expect(markup).toContain("Hiện đáp án");
  expect(markup).toContain("<ruby");
  expect(markup).toContain('aria-label="Đọc tiếng Trung: 这个设计图 很漂亮。"');
 });

 it("pairs the separate lesson translation with each Chinese turn and excludes the speaker from TTS", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 1);
  if (!lesson) throw new Error("Expected Business Chinese lesson 1.");
  const mainSection = lesson.sections.find((section) => section.title.includes("BÀI KHÓA CHÍNH"));
  const translationSection = lesson.sections.find((section) =>
   section.title.includes("DỊCH BÀI KHÓA"),
  );
  if (!mainSection || !translationSection) {
   throw new Error("Expected paired source and translation sections.");
  }
  const focusedLesson = {
   ...lesson,
   sections: [mainSection, translationSection],
  };

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={books} lesson={focusedLesson} />,
  );

  expect(markup).toContain("赵经理");
  expect(markup).toContain("Xin chào! Cho tôi hỏi có phải là Giám đốc Tôn không ạ?");
  expect(markup).not.toContain("DỊCH BÀI KHÓA");
  expect(markup).toContain("data-reader-segment-id=");
  expect(markup).toContain('aria-label="Đọc từ chữ 您"');
  expect(markup).not.toContain('aria-label="Đọc tiếng Trung: 赵经理： 您好！请问是孙经理吗？"');
  expect(markup).toContain("60%");
  expect(readerDocumentMock).toHaveBeenLastCalledWith(
   expect.objectContaining({
    segments: expect.arrayContaining([
     expect.objectContaining({
      zh: "您好！请问是孙经理吗？",
      speechText: "您好！请问是孙经理吗？",
      speaker: { label: "赵经理" },
      vi: "Xin chào! Cho tôi hỏi có phải là Giám đốc Tôn không ạ?",
     }),
    ]),
   }),
  );
  expect(markup).toContain('aria-label="Pinyin chữ 行 cần kiểm tra"');
  expect(markup).toContain("text-warning underline decoration-dotted underline-offset-2");
  expect(markup).toContain("Công cụ học");
 });

 it("renders inline lesson translations with the same speaker and TTS structure", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 3);
  if (!lesson) throw new Error("Expected Business Chinese lesson 3.");
  const mainSection = lesson.sections.find((section) => section.title.includes("BÀI KHÓA CHÍNH"));
  if (!mainSection) throw new Error("Expected the representative inline-translation section.");
  const focusedLesson = { ...lesson, sections: [mainSection] };

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={books} lesson={focusedLesson} />,
  );

  expect(markup).toContain("杜森");
  expect(markup).toContain(
   "Xin chào, tôi là Đỗ Sâm của Công ty Moore Mỹ, đây là danh thiếp của tôi.",
  );
  expect(markup).toContain('aria-label="Đọc từ chữ 您"');
  expect(readerDocumentMock).toHaveBeenLastCalledWith(
   expect.objectContaining({
    segments: expect.arrayContaining([
     expect.objectContaining({
      speechText: "您好，我是美国摩尔公司的杜森，这是我的名片。",
      speaker: { label: "杜森" },
      vi: "Xin chào, tôi là Đỗ Sâm của Công ty Moore Mỹ, đây là danh thiếp của tôi.",
     }),
    ]),
   }),
  );
  expect(markup).not.toContain(
   'aria-label="Đọc tiếng Trung: 杜森： 您好，我是美国摩尔公司的杜森，这是我的名片。"',
  );
 });
});
