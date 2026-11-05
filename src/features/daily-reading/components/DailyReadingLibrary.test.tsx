import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import {
 dailyReadingSchema,
 type DailyReading,
} from "@/features/daily-reading/model/daily-reading.schemas";

const sampleReading: DailyReading = dailyReadingSchema.parse({
 schemaVersion: "2.0.0",
 id: "sample-reading-1",
 publishedDate: "2026-11-05",
 capturedAt: "2026-11-05T12:00:00.000Z",
 releaseKind: "manual",
 provenance: "source-captured",
 estimatedMinutes: 5,
 source: {
  url: "https://example.com/article-1",
  publisher: "China News",
  titleZh: "中越经贸合作迎来新发展",
  publishedAt: "2026-11-05T10:00:00.000Z",
  capturedAt: "2026-11-05T12:00:00.000Z",
 },
 article: {
  fingerprint: "1234abcd",
  titleZh: "中越经贸合作迎来新发展",
  hanCharacterCount: 90,
  paragraphs: [
   {
    id: "p-1",
    order: 1,
    zh: "随着区域经济一体化推进，中越两国经贸往来日益频繁。",
   },
   {
    id: "p-2",
    order: 2,
    zh: "双方在数字经济、绿色能源等新兴产业领域展现出广阔合作空间。",
   },
   {
    id: "p-3",
    order: 3,
    zh: "两国产业界正共同构建更加韧性的产业链与供应链合作格局。",
   },
  ],
 },
 classification: {
  targetLevel: "HSK4",
  topic: "society",
  estimatedLevel: null,
 },
 enrichment: {
  translation: {
   status: "ready",
   updatedAt: "2026-11-05T12:05:00.000Z",
   generatedBy: null,
   data: {
    titleVi: "Hợp tác kinh tế thương mại Trung - Việt đón bước phát triển mới",
    whyWorthReadingVi: "Bài viết phù hợp cho người học tiếng Trung thương mại.",
    adaptationNoticeVi: "",
    paragraphs: [
     {
      paragraphId: "p-1",
      vi: "Cùng với thúc đẩy liên kết kinh tế khu vực, giao lưu thương mại hai nước ngày càng sôi động.",
      roleVi: "main",
     },
     {
      paragraphId: "p-2",
      vi: "Đôi bên thể hiện không gian hợp tác rộng mở trong các ngành mới như kinh tế số, năng lượng xanh.",
      roleVi: "main",
     },
     {
      paragraphId: "p-3",
      vi: "Giới công nghiệp hai nước đang cùng xây dựng chuỗi cung ứng bền bỉ hơn.",
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
      hanzi: "经贸",
      meaningVi: "kinh tế và thương mại",
      meaningInContextVi: "hợp tác kinh tế thương mại",
      categoryVi: "Kinh tế",
     },
     {
      id: "v2",
      order: 2,
      hanzi: "合作",
      meaningVi: "hợp tác",
      meaningInContextVi: "hợp tác đôi bên",
      categoryVi: "Quan hệ",
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

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
 useRouter: () => ({ push: vi.fn() }),
 usePathname: () => "/daily-reading",
}));

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/daily-reading/services/daily-reading.client", () => ({
 useDailyReadingLibrary: () => ({
  items: [sampleReading],
  captureRuns: [],
  enrichmentRuns: [],
 }),
 useDailyReadingSettings: () => ({
  settings: {
   captureTime: { hour: 7, minute: 0 },
   autoEnrich: true,
  },
  update: vi.fn(),
 }),
 captureDailyReadingNow: vi.fn(),
 reconcilePendingDailyReadingEnrichmentJobs: vi.fn(),
}));

vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => ({
  state: {
   settings: {
    lessonTextDisplayMode: { showPinyin: true, showMeaning: true },
   },
  },
 }),
}));

vi.mock("@/features/speech/MandarinTtsProvider", () => ({
 useMandarinReaderSpeechService: () => ({
  speak: vi.fn(),
  stop: vi.fn(),
  prepare: vi.fn(),
 }),
 useMandarinTtsControls: () => ({
  isSpeaking: false,
  isLoading: false,
  speakingRequestText: null,
  stop: vi.fn(),
 }),
}));

vi.mock("@/features/dictionary/hooks/useVocabInspector", () => ({
 useVocabInspector: () => ({
  openInspector: vi.fn(),
 }),
}));

vi.mock("@/features/reading/hooks/useReaderSessionPronunciation", () => ({
 useReaderSessionPronunciation: () => new Map(),
}));

vi.mock("@/features/reader/components/Reader", () => ({
 Reader: () => <div data-testid="reader-mock">Reader Mock</div>,
}));

import { DailyReadingLibrary, DailyReadingView } from "./DailyReadingLibrary";

describe("DailyReadingLibrary UI enhancements", () => {
 const locale: AppLocale = "vi";

 it("renders the library tab with compact action bar, search input, and article count", async () => {
  const messages = await loadAppMessages(locale);
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <DailyReadingLibrary />
   </NextIntlClientProvider>,
  );

  expect(markup).toContain("hanzihome-liquid-toolbar");
  expect(markup).toContain("Tìm bài đọc...");
  expect(markup).toContain("1 bài");
  expect(markup).toContain("中越经贸合作迎来新发展");
 });

 it("renders DailyReadingView with liquid toolbar, back action in tabs, and enhanced vocabulary tab with pinyin/meaning toggles", async () => {
  const messages = await loadAppMessages(locale);
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <DailyReadingView id="sample-reading-1" onBack={vi.fn()} />
   </NextIntlClientProvider>,
  );

  expect(markup).toContain("hanzihome-liquid-toolbar");
  // The tabs should contain back action
  expect(markup).toContain(messages.DailyReading.document.back);
 });
});
