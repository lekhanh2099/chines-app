import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

import { dailyReadingSchema } from "./daily-reading.schemas";

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/features/settings/AddApiKeyDialog", () => ({
 AddApiKeyDialog: ({ trigger }: { trigger: ReactNode }) => trigger,
}));
vi.mock("@/features/ai-runtime/useAiRuntimeReadiness", () => ({
 useAiRuntimeReadiness: () => ({
  data: {
   status: "ready",
   taskRuntimes: [
    "daily-reading.translation",
    "daily-reading.vocabulary",
    "daily-reading.grammar",
    "daily-reading.questions",
   ].map((taskId) => ({
    taskId,
    status: "ready",
    receipt: {
     taskId,
     provider: "gemini",
     model: "models/gemini-3.5-flash",
     keyId: "11111111-1111-4111-8111-111111111111",
     keyLabel: "Gemini",
     resolutionSource: "assigned",
    },
   })),
  },
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
 }),
}));
vi.mock("./daily-reading.client", () => ({
 useDailyReadingLibrary: () => ({ enrichmentRuns: [] }),
}));

import { DailyReadingLearningSupportPanel } from "./DailyReadingLearningSupportPanel";

const locales = ["vi", "en", "zh-CN"] satisfies readonly AppLocale[];
const reading = dailyReadingSchema.parse({
 schemaVersion: "2.0.0",
 id: "daily:2026-08-28:1234abcd",
 publishedDate: "2026-08-28",
 capturedAt: "2026-08-28T02:00:00.000Z",
 releaseKind: "manual",
 provenance: "source-captured",
 source: {
  titleZh: "城市文化活动",
  publisher: "中国新闻网",
  url: "https://www.chinanews.com.cn/cul/2026/08-28/example.shtml",
  publishedAt: "2026-08-28T01:00:00.000Z",
  capturedAt: "2026-08-28T02:00:00.000Z",
 },
 article: {
  titleZh: "城市文化活动",
  paragraphs: [
   { id: "source-p1", order: 1, zh: "城市举办文化活动。" },
   { id: "source-p2", order: 2, zh: "年轻读者来到现场。" },
   { id: "source-p3", order: 3, zh: "学校也参与了活动。" },
  ],
  hanCharacterCount: 30,
  fingerprint: "1234abcd",
 },
 classification: { topic: "culture", targetLevel: "HSK5", estimatedLevel: null },
 estimatedMinutes: 3,
 enrichment: {
  translation: { status: "idle" },
  vocabulary: { status: "idle" },
  grammar: { status: "idle" },
  questions: { status: "idle" },
 },
});

describe("Daily Reading learning support translations", () => {
 it.each(locales)("renders all module controls without raw message keys for %s", async (locale) => {
  const messages = await loadAppMessages(locale);
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <DailyReadingLearningSupportPanel reading={reading} />
   </NextIntlClientProvider>,
  );

  expect(markup).toContain(messages.DailyReading.enrichment.modules.translation.title);
  expect(markup).toContain(messages.DailyReading.enrichment.modules.vocabulary.title);
  expect(markup).toContain(messages.DailyReading.enrichment.modules.grammar.title);
  expect(markup).toContain(messages.DailyReading.enrichment.modules.questions.title);
  expect(markup).not.toContain("DailyReading.");
 });
});
