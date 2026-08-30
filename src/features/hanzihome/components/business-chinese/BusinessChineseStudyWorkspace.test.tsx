import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import businessChineseMessages from "../../../../../messages/vi/business-chinese.json";
import readerMessages from "../../../../../messages/vi/reader.json";
import readerDocumentMessages from "../../../../../messages/vi/reader-document.json";
import readerStudyMessages from "../../../../../messages/vi/reader-study.json";
import type { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import { ModuleSplitWorkspace } from "@/features/hanzihome/components/ModuleSplitWorkspace";
import type { StudyModule } from "@/features/hanzihome/context/types";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { attachLessonVocabularyResource } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import {
 getStaticStudioCourseCatalog,
 getStaticStudioLessonDetail,
} from "@/features/hanzihome/static-json/studio-static-content";
import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";

type SidebarItemProps = ComponentProps<typeof LessonModuleSidebarItem>;

const routerPushMock = vi.hoisted(() => vi.fn());
const sidebarItemMock = vi.hoisted(() => vi.fn<(props: SidebarItemProps) => void>());

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ isResolved: true, userId: null }),
}));

vi.mock("@/i18n/navigation", () => ({
 useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("@/features/hanzihome/annotations/LessonAnnotationProvider", () => ({
 LessonAnnotationProvider: () => {
  throw new Error("Read-only Business Chinese must not mount annotations.");
 },
}));

vi.mock("@/features/hanzihome/hooks/useHanziHomeLessonResources", () => ({
 useHanziHomeLessonSections: () => {
  throw new Error("Read-only Business Chinese must not query lesson sections.");
 },
 useHanziHomeLessonVocabulary: () => {
  throw new Error("Read-only Business Chinese must not query lesson vocabulary.");
 },
}));

vi.mock("@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem", () => ({
 LessonModuleSidebarItem: (props: SidebarItemProps) => {
  sidebarItemMock(props);
  return <button type="button">{props.title}</button>;
 },
}));

import { BusinessChineseStudyWorkspace } from "./BusinessChineseStudyWorkspace";

describe("BusinessChineseStudyWorkspace", () => {
 it("renders canonical content through the read-only lesson workspace", () => {
  const catalog = getStaticStudioCourseCatalog("hanzihome-business-chinese");
  const staticLesson = getStaticStudioLessonDetail("business-chinese-tm2-lesson-02");
  if (!catalog || !staticLesson) throw new Error("Expected the Business Chinese static corpus.");
  const lesson = attachLessonVocabularyResource(staticLesson, {
   lessonId: staticLesson.id,
   items: staticLesson.vocab,
   total: staticLesson.vocab.length,
  });
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  const markup = renderToStaticMarkup(
   <NextIntlClientProvider
    locale="vi"
    messages={{
     BusinessChinese: businessChineseMessages,
     Reader: {
      ...readerMessages,
      study: readerStudyMessages,
      document: readerDocumentMessages,
     },
    }}
    timeZone="Asia/Ho_Chi_Minh"
   >
    <MandarinTtsProvider>
     <BusinessChineseStudyWorkspace
      books={catalog.books}
      lessons={catalog.lessons}
      lesson={lesson}
     />
    </MandarinTtsProvider>
   </NextIntlClientProvider>,
  );
  const textbookSectionItem = sidebarItemMock.mock.calls.find(([props]) =>
   props.title.includes("BÀI KHÓA CHÍNH"),
  )?.[0];

  expect(markup).toContain('aria-label="Đọc từ chữ 思"');
  expect(markup).toContain('aria-label="Đọc từ chữ 美"');
  expect(markup).toContain("Mời ngài tham dự Hội nghị giới thiệu sản phẩm");
  expect(markup).toContain("Đề mục");
  expect(markup).toContain("Nghe bài");
  expect(markup).toContain("qǐng");
  expect(textbookSectionItem).toBeDefined();
  expect(textbookSectionItem?.selected).toBe(true);
  expect(markup).not.toContain("Vậy là tôi đã xuất");
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
 });

 it.each([
  { module: "overview", expected: "GIỚI THIỆU TỔNG QUAN" },
  { module: "lessonText", expected: "Mời ngài tham dự Hội nghị giới thiệu sản phẩm" },
  { module: "notes", expected: "TỪ VỰNG TRỌNG TÂM" },
  { module: "vocab", expected: "产品" },
  { module: "grammar", expected: "NGỮ PHÁP TRỌNG TÂM" },
  { module: "review", expected: "TÓM TẮT NỘI DUNG" },
  { module: "practice", expected: "BÀI TẬP VẬN DỤNG" },
 ] satisfies ReadonlyArray<{ module: StudyModule; expected: string }>)(
  "renders static JSON for the $module tab without connected data hooks",
  ({ module, expected }) => {
   const staticLesson = getStaticStudioLessonDetail("business-chinese-tm2-lesson-02");
   if (!staticLesson) throw new Error("Expected the Business Chinese static corpus.");
   const lesson = attachLessonVocabularyResource(staticLesson, {
    lessonId: staticLesson.id,
    items: staticLesson.vocab,
    total: staticLesson.vocab.length,
   });
   const fetchSpy = vi.spyOn(globalThis, "fetch");

   const markup = renderToStaticMarkup(
    <NextIntlClientProvider
     locale="vi"
     messages={{
      BusinessChinese: businessChineseMessages,
      Reader: {
       ...readerMessages,
       study: readerStudyMessages,
       document: readerDocumentMessages,
      },
     }}
     timeZone="Asia/Ho_Chi_Minh"
    >
     <MandarinTtsProvider>
      <ModuleSplitWorkspace
       readOnly
       lesson={lesson}
       learningState={emptyLearningState}
       activeModule={module}
       onSelectModule={vi.fn()}
       onUpdateLearningSettings={vi.fn()}
       onBookmarkVocab={vi.fn()}
       onMarkVocab={vi.fn()}
       onBookmarkGrammar={vi.fn()}
       onMarkGrammar={vi.fn()}
       onAnswerReview={vi.fn()}
      />
     </MandarinTtsProvider>
    </NextIntlClientProvider>,
   );

   expect(markup).toContain(expected);
   expect(fetchSpy).not.toHaveBeenCalled();
   fetchSpy.mockRestore();
  },
 );
});
