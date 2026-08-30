import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import businessChineseMessages from "../../../../../messages/vi/business-chinese.json";
import readerDocumentMessages from "../../../../../messages/vi/reader-document.json";
import type { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import {
 getBusinessChineseCatalog,
 getBusinessChineseLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

type SidebarItemProps = ComponentProps<typeof LessonModuleSidebarItem>;

const routerPushMock = vi.hoisted(() => vi.fn());
const sidebarItemMock = vi.hoisted(() => vi.fn<(props: SidebarItemProps) => void>());

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

import { BusinessChineseStudyWorkspace } from "./BusinessChineseStudyWorkspace";

function renderWorkspace(element: ReactNode) {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{
    BusinessChinese: businessChineseMessages,
    Reader: { document: readerDocumentMessages },
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
});
