import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { CourseCard } from "./CourseCard";

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "test-user-123", isResolved: true }),
}));

vi.mock("@tanstack/react-query", () => ({
 useQueryClient: () => ({
  invalidateQueries: vi.fn(),
 }),
 useQuery: () => ({
  data: { status: "not_cached", cachedLessonsCount: 0, totalLessonsCount: 2 },
 }),
}));

vi.mock("next-intl", () => ({
 useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, ...props }: { children: React.ReactNode }) =>
  createElement("a", props, children),
 useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/components/ui/tooltip", () => ({
 Tooltip: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
 TooltipTrigger: ({ children }: { children: React.ReactNode }) =>
  createElement("div", null, children),
 TooltipContent: ({ children }: { children: React.ReactNode }) =>
  createElement("div", null, children),
}));

describe("CourseCard", () => {
 it("renders CourseOfflineDownloadButton for book lessons", () => {
  const course: HanziHomeCatalogCourse = {
   id: "course-1",
   slug: "course-1",
   title: "Hán ngữ 1",
   type: "general",
   order: 1,
   stats: { bookCount: 1, lessonCount: 2, vocabCount: 10, grammarCount: 5 },
  };
  const book: HanziHomeCourseBook = {
   id: "book-1",
   courseId: "course-1",
   title: "Quyển 1",
   order: 1,
  };
  const lessons: HanziHomeLesson[] = [
   {
    id: "l1",
    courseId: "course-1",
    bookId: "book-1",
    lessonNumber: 1,
    title: "Lesson 1",
    titleZh: "第一课",
    vocabIds: [],
    grammarPointIds: [],
    vocab: [],
    grammar: [],
   },
   {
    id: "l2",
    courseId: "course-1",
    bookId: "book-1",
    lessonNumber: 2,
    title: "Lesson 2",
    titleZh: "第二课",
    vocabIds: [],
    grammarPointIds: [],
    vocab: [],
    grammar: [],
   },
  ];

  const html = renderToStaticMarkup(
   createElement(CourseCard, {
    course,
    book,
    lessons,
    editMode: false,
   }),
  );

  expect(html).toContain("offlinePack.downloadCourse");
 });
});
