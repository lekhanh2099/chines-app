import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourseOfflineDownloadButton } from "./CourseOfflineDownloadButton";
import * as useCourseOfflinePackModule from "./useCourseOfflinePack";

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "test-user-123", isResolved: true }),
}));

vi.mock("next-intl", () => ({
 useTranslations: () => (key: string, values?: { percent?: number }) =>
  `${key}:${values?.percent ?? 0}`,
}));

vi.mock("@/components/ui/tooltip", () => ({
 Tooltip: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
 TooltipTrigger: ({ children }: { children: React.ReactNode }) =>
  createElement("div", null, children),
 TooltipContent: ({ children }: { children: React.ReactNode }) =>
  createElement("div", null, children),
}));

describe("CourseOfflineDownloadButton", () => {
 beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(useCourseOfflinePackModule, "useCourseOfflinePack").mockReturnValue({
   status: "not_cached",
   cachedLessonsCount: 0,
   totalLessonsCount: 0,
   isDownloading: false,
   progress: null,
   download: vi.fn(),
   evict: vi.fn(),
   refreshStatus: vi.fn(),
  });
 });

 it("renders null if lessonIds array is empty", () => {
  const html = renderToStaticMarkup(
   createElement(CourseOfflineDownloadButton, {
    courseId: "c1",
    lessonIds: [],
   }),
  );
  expect(html).toBe("");
 });

 it("renders download button when not cached", () => {
  vi.spyOn(useCourseOfflinePackModule, "useCourseOfflinePack").mockReturnValue({
   status: "not_cached",
   cachedLessonsCount: 0,
   totalLessonsCount: 3,
   isDownloading: false,
   progress: null,
   download: vi.fn(),
   evict: vi.fn(),
   refreshStatus: vi.fn(),
  });

  const html = renderToStaticMarkup(
   createElement(CourseOfflineDownloadButton, {
    courseId: "c1",
    lessonIds: ["l1", "l2", "l3"],
   }),
  );

  expect(html).toContain("offlinePack.downloadCourse");
 });

 it("renders ready badge when fully cached", () => {
  vi.spyOn(useCourseOfflinePackModule, "useCourseOfflinePack").mockReturnValue({
   status: "fully_cached",
   cachedLessonsCount: 3,
   totalLessonsCount: 3,
   isDownloading: false,
   progress: null,
   download: vi.fn(),
   evict: vi.fn(),
   refreshStatus: vi.fn(),
  });

  const html = renderToStaticMarkup(
   createElement(CourseOfflineDownloadButton, {
    courseId: "c1",
    lessonIds: ["l1", "l2", "l3"],
   }),
  );

  expect(html).toContain("offlinePack.downloadReady");
 });

 it("renders progress percentage when downloading", () => {
  vi.spyOn(useCourseOfflinePackModule, "useCourseOfflinePack").mockReturnValue({
   status: "partially_cached",
   cachedLessonsCount: 1,
   totalLessonsCount: 3,
   isDownloading: true,
   progress: {
    courseId: "c1",
    totalLessons: 3,
    completedLessons: 2,
    percent: 66,
   },
   download: vi.fn(),
   evict: vi.fn(),
   refreshStatus: vi.fn(),
  });

  const html = renderToStaticMarkup(
   createElement(CourseOfflineDownloadButton, {
    courseId: "c1",
    lessonIds: ["l1", "l2", "l3"],
   }),
  );

  expect(html).toContain("66%");
 });
});
