import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { loadAppMessages } from "@/i18n/messages";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

import { hanziHomeVocabItemSchema, lessonSchema } from "./hanzihome-api.schemas";

const ownerId = "00000000-0000-4000-8000-000000000001";

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ user: { id: ownerId }, userId: ownerId }),
}));
vi.mock("@/features/hanzihome/hooks/useHanziHomeCatalogData", () => ({
 useHanziHomeCatalogData: () => ({ lessons: [{ id: "lesson-1", lessonNumber: 1 }] }),
}));
vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => ({ state: {} }),
}));
vi.mock("@/features/hanzihome/components/review/UnifiedVocabStudyHub", () => ({
 UnifiedVocabStudyHub: () => null,
}));
vi.mock("@/features/hanzihome/components/VocabReviewPanel", () => ({
 VocabReviewPanel: ({ lesson }: { lesson: HanziHomeLesson }) => (
  <output data-testid="review-deck">{lesson.vocab.map((item) => item.hanzi).join(",")}</output>
 ),
}));

import { HanziHomeVocabReviewPage } from "./HanziHomeVocabReviewPage";

function lessonDetail(): HanziHomeLesson {
 // Lesson detail from the repository never carries vocabulary (vocab: []).
 return lessonSchema.parse({
  id: "lesson-1",
  lessonNumber: 1,
  titleZh: "第一课",
  title: "Bài 1",
  vocabIds: [],
  grammarPointIds: [],
  vocab: [],
  grammar: [],
 });
}

function vocabularyItem(id: string, order: number, hanzi: string) {
 return hanziHomeVocabItemSchema.parse({
  id,
  order,
  hanzi,
  pinyin: "pinyin",
  pos: { normalized: "verb" },
  meaning: { hanviet: "", meaning_vi: hanzi, meaning_en: "" },
  examples: [],
  runtimeId: `lesson-1__${id}`,
  lessonId: "lesson-1",
  category: "Động từ",
 });
}

describe("HanziHomeVocabReviewPage", () => {
 it("builds the flashcard deck from the canonical lesson vocabulary resource", async () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(hanzihomeQueryKeys.lessonDetail("lesson-1"), lessonDetail());
  queryClient.setQueryData(hanzihomeQueryKeys.lessonResource("lesson-1", "vocabulary"), {
   lessonId: "lesson-1",
   items: [vocabularyItem("word-1", 1, "学习"), vocabularyItem("word-2", 2, "工作")],
   total: 2,
  });

  const markup = renderToStaticMarkup(
   <NextIntlClientProvider
    locale="vi"
    messages={await loadAppMessages("vi")}
    timeZone="Asia/Ho_Chi_Minh"
   >
    <QueryClientProvider client={queryClient}>
     <HanziHomeVocabReviewPage reviewLessonsParam="lesson-1" />
    </QueryClientProvider>
   </NextIntlClientProvider>,
  );

  expect(markup).toContain('data-testid="review-deck">学习,工作</output>');
 });
});
