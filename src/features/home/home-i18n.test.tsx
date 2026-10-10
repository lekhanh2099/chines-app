import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ContinueLearningPanel } from "@/features/home/components/ContinueLearningPanel";
import { HomeLearningPulse } from "@/features/home/components/HomeLearningPulse";
import { RecentLearningActivityPanel } from "@/features/home/components/RecentLearningActivityPanel";
import { RecentNotesPanel } from "@/features/home/components/RecentNotesPanel";
import type { HomeLessonTarget } from "@/features/home/types";
import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const lesson = {
 href: "/hanzihome?lesson=1",
 title: "Welcome",
 titleZh: "你好",
 courseTitle: "HSK 1",
 lessonNumber: 1,
 module: "vocab",
 isRecent: true,
} satisfies HomeLessonTarget;

const localeCases = [
 { locale: "vi", heading: "Học tiếp", module: "Từ vựng", lesson: "Bài 1: 你好" },
 { locale: "en", heading: "Continue learning", module: "Vocabulary", lesson: "Lesson 1: 你好" },
 { locale: "zh-CN", heading: "继续学习", module: "词汇", lesson: "第 1 课：你好" },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 heading: string;
 module: string;
 lesson: string;
}>;

describe("Home messages", () => {
 it.each(localeCases)("renders the learning continuation chrome for $locale", async (testCase) => {
  const messages = await loadAppMessages(testCase.locale);
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale={testCase.locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <ContinueLearningPanel
     courses={[{ id: "course", title: "HSK 1", books: [{ id: "book", title: "HSK 1", lesson }] }]}
     unavailable={false}
    />
   </NextIntlClientProvider>,
  );

  expect(markup).toContain(testCase.heading);
  expect(markup).toContain(testCase.module);
  expect(markup).toContain(testCase.lesson);
  expect(markup).not.toContain("Home.");
 });

 it("keeps learning pulse values subordinate to the section heading", async () => {
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <HomeLearningPulse
     onRetryOverview={() => {}}
     onRetryReviewedToday={() => {}}
     pulse={{
      trackedCount: 12,
      reviewCount: 3,
      knownCount: 9,
      reviewedTodayCount: 4,
      bookmarkedCount: 2,
      srsDueCount: 5,
      learningLoopDueCount: 1,
      readerCompletedCount: 2,
      readerDocumentCount: 6,
      overviewUnavailable: false,
      overviewAvailable: true,
      overviewLoading: false,
      reviewedTodayAvailable: true,
      reviewedTodayLoading: false,
      reviewedTodayUnavailable: false,
     }}
    />
   </NextIntlClientProvider>,
  );

  expect(markup).toContain("Nhịp học");
  expect((markup.match(/data-variant="sectionTitle"/g) ?? []).length).toBe(1);
 });

 it.each(localeCases)(
  "formats relative activity dates without environment fallback for $locale",
  async (testCase) => {
   const messages = await loadAppMessages(testCase.locale);
   const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

   const markup = renderToStaticMarkup(
    <NextIntlClientProvider
     locale={testCase.locale}
     messages={messages}
     timeZone="Asia/Ho_Chi_Minh"
    >
     <RecentNotesPanel
      loading={false}
      unavailable={false}
      onRetry={() => {}}
      notes={[
       {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Study note",
        tags: [],
        status: "draft",
        category: "general",
        short_id: null,
        updated_at: "2026-08-25T10:00:00.000Z",
        linked_lesson_id: null,
        folder_id: null,
        reading_status: null,
        source_url: null,
        source_host: null,
        source_label: null,
        source_author: null,
        source_published_at: null,
        source_captured_at: null,
        revision: 0,
        links: [],
       },
      ]}
     />
     <RecentLearningActivityPanel
      loading={false}
      unavailable={false}
      onRetry={() => {}}
      items={[
       {
        key: "00000000-0000-4000-8000-000000000002",
        label: "坚持",
        kindLabel: "Vocabulary",
        result: "known",
        answeredAt: "2026-08-25T10:00:00.000Z",
       },
      ]}
     />
    </NextIntlClientProvider>,
   );

   expect(markup).toContain("Study note");
   expect(markup).toContain("坚持");
   expect(consoleError).not.toHaveBeenCalled();
   consoleError.mockRestore();
  },
 );

 it.each([
  {
   locale: "vi",
   error: "Không tải được ghi chú gần đây",
   empty: "Chưa có ghi chú gần đây",
   retry: "Thử lại",
  },
  { locale: "en", error: "Could not load recent notes", empty: "No recent notes", retry: "Retry" },
  { locale: "zh-CN", error: "无法加载最近的笔记", empty: "没有最近笔记", retry: "重试" },
 ] satisfies ReadonlyArray<{ locale: AppLocale; error: string; empty: string; retry: string }>)(
  "keeps failed recent-notes reads separate from a valid empty list for $locale",
  async (testCase) => {
   const messages = await loadAppMessages(testCase.locale);
   const render = (unavailable: boolean, loading = false) =>
    renderToStaticMarkup(
     <NextIntlClientProvider
      locale={testCase.locale}
      messages={messages}
      timeZone="Asia/Ho_Chi_Minh"
     >
      <RecentNotesPanel notes={[]} loading={loading} unavailable={unavailable} onRetry={() => {}} />
     </NextIntlClientProvider>,
    );
   const failed = render(true);
   expect(failed).toContain('role="alert"');
   expect(failed).toContain(testCase.error);
   expect(failed).toContain(testCase.retry);
   expect(failed).not.toContain(testCase.empty);
   expect(failed).not.toContain("Home.");
   const empty = render(false);
   expect(empty).not.toContain('role="alert"');
   expect(empty).toContain(testCase.empty);
   const pending = render(false, true);
   expect(pending).toContain('aria-busy="true"');
   expect(pending).not.toContain(testCase.empty);
   expect(pending).not.toContain('role="alert"');
   expect(pending).not.toContain("Home.");
  },
 );
});
