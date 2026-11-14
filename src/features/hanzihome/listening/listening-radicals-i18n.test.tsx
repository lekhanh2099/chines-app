import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loadAppMessages } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/config";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { RadicalWorkspace } from "@/features/hanzihome/components/RadicalWorkspace";
import { RadicalDetailPanel } from "@/features/hanzihome/components/RadicalDetailPanel";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import { ListeningExerciseItems } from "./ListeningExerciseItems";
import { ListeningTranscriptBlock } from "./ListeningTranscriptBlock";
import type {
 ListeningLessonBundle,
 ListeningRuntimeItem,
 ListeningTranscript,
} from "./listening.types";
import { ListeningWorkspace } from "./ListeningWorkspace";
import { ListeningDictationWorkspace } from "./ListeningDictationWorkspace";
import { listeningQueryKeys } from "./listening.query-keys";
import type { HanziHomeFeatureRuntime } from "../context/types";
import { emptyLearningState } from "../utils/learning-state";

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: null }),
}));
vi.mock("@/features/hanzihome/context/runtime", () => ({
 useHanziHomeRuntime: () => runtime,
}));

vi.mock("@/features/hanzihome/hooks/useHanziHomeCanEdit", () => ({
 useHanziHomeCanEdit: () => false,
}));
vi.mock("@/features/hanzihome/search/searchNavigationStore", () => ({
 useHanziHomeSearchNavigationIntent: () => null,
}));
vi.mock("@/features/hanzihome/context/selectors", () => ({ useHanziHomeEditMode: () => false }));
vi.mock("@/features/hanzihome/context/actions", () => ({
 useHanziHomeFeatureActions: () => ({ openEditableNode: () => {} }),
}));
const cases = [
 {
  locale: "vi",
  filter: "Lọc theo số nét",
  details: "Ý nghĩa cốt lõi",
  exercise: "Chọn đáp án",
  script: "Script đáp án",
  question: "Câu 1",
 },
 {
  locale: "en",
  filter: "Filter by stroke count",
  details: "Core meaning",
  exercise: "Choose answer",
  script: "Answer transcript",
  question: "Question 1",
 },
 {
  locale: "zh-CN",
  filter: "按笔画筛选",
  details: "核心含义",
  exercise: "选择答案",
  script: "答案原文",
  question: "第 1 题",
 },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 filter: string;
 details: string;
 exercise: string;
 script: string;
 question: string;
}>;
const radical: StaticRadicalData = {
 id: "water",
 index: 85,
 radical: "水",
 nameVi: "Thủy",
 strokes: 4,
 coreMeaning: { modern: "Nước là nội dung học" },
 variants: [],
 distinguish: [],
};
const transcript: ListeningTranscript = {
 mode: "monologue",
 speakers: [{ id: "speaker", labelZh: "老师", labelVi: "Giáo viên", voice: "neutral" }],
 lines: [
  {
   order: 1,
   speakerId: "speaker",
   zh: "答案文本",
   pinyin: "dá àn wén běn",
   vi: "Đáp án học giữ nguyên",
  },
 ],
 full: { zh: "答案文本", pinyin: "dá àn wén běn", vi: "Đáp án học giữ nguyên" },
};
const exercise: ListeningRuntimeItem = {
 id: "question",
 sectionId: "section",
 order: 1,
 type: "sentence_mcq",
 promptZh: "问题文本",
 transcript,
 options: [{ key: "A", textZh: "学习内容" }],
 answer: { type: "choice", value: "A" },
 metadata: {},
};
const noop = () => {};
const lesson: HanziHomeFeatureRuntime["lesson"] = {
 id: "fixture-listening",
 lessonNumber: 1,
 titleZh: "听力",
 title: "Listening fixture",
 vocabIds: [],
 grammarPointIds: [],
 vocab: [],
 grammar: [],
};
const runtime: HanziHomeFeatureRuntime = {
 readOnly: true,
 originalLesson: lesson,
 lesson,
 learningState: emptyLearningState,
 activeModule: "listening",
 selectModule: noop,
 updateLearningSettings: noop,
 bookmarkVocab: noop,
 markVocab: noop,
 bookmarkGrammar: noop,
 markGrammar: noop,
 answerReview: noop,
};
describe("Listening and radical locale ownership", () => {
 it.each(cases)("localizes chrome and keeps learner content in $locale", async (item) => {
  const messages = await loadAppMessages(item.locale);
  const render = (showScript: boolean) =>
   renderToStaticMarkup(
    <NextIntlClientProvider locale={item.locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <MandarinTtsProvider>
      <RadicalWorkspace radicals={[radical]} />
      <RadicalDetailPanel radical={radical} editMode={false} onEdit={noop} />
      <ListeningExerciseItems
       exerciseType="single_choice"
       items={[exercise]}
       showPinyin={false}
       showMeaning={false}
       showScript={showScript}
       hideScriptBeforeCheck
       showTranslationAfterCheck
       displayMode={DEFAULT_LESSON_DISPLAY_MODE}
       onSpeak={noop}
       onSpeakSequence={noop}
       lessonId="lesson"
      />
      {showScript ? (
       <ListeningTranscriptBlock
        transcript={transcript}
        displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: true }}
        onSpeak={noop}
        onSpeakSequence={noop}
       />
      ) : null}
     </MandarinTtsProvider>
    </NextIntlClientProvider>,
   );
  const hidden = render(false);
  for (const value of [
   item.filter,
   item.details,
   item.exercise,
   item.question,
   "Thủy",
   "Nước là nội dung học",
   "问题文本",
  ])
   expect(hidden).toContain(value);
  expect(hidden).not.toContain("答案文本");
  const revealed = render(true);
  expect(revealed).toContain(item.script);
  expect(revealed).toContain("答案文本");
  expect(revealed).toContain("Đáp án học giữ nguyên");
  expect(revealed).not.toContain("Listening.");
  expect(revealed).not.toContain("Radicals.");
 });

 it.each(cases)(
  "distinguishes pending, empty and error in both workspaces in $locale",
  async (item) => {
   const messages = await loadAppMessages(item.locale);
   // Pin real cache states for SSR; mounted retry scheduling is a separate contract.
   const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnMount: false, retryOnMount: false } },
   });
   const render = () =>
    renderToStaticMarkup(
     <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={item.locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
       <MandarinTtsProvider>
        <ListeningWorkspace />
        <ListeningDictationWorkspace />
       </MandarinTtsProvider>
      </NextIntlClientProvider>
     </QueryClientProvider>,
    );
   try {
    const pending = render();
    expect(pending).toContain(messages.Listening.loading);
    expect(pending).toContain(messages.Listening.dictationLoading);
    expect(pending).not.toContain(messages.Listening.empty);
    queryClient.setQueryData<ListeningLessonBundle>(listeningQueryKeys.lesson(lesson.id), {
     lesson: { id: lesson.id, titleZh: lesson.titleZh },
     sections: [],
     items: [],
    });
    const empty = render();
    expect(empty.split(`>${messages.Listening.emptyTitle}</p>`)).toHaveLength(3);
    expect(empty).toContain(messages.Listening.empty);
    expect(empty).not.toContain(messages.Listening.loadError);
    queryClient.clear();
    await expect(
     queryClient.fetchQuery({
      queryKey: listeningQueryKeys.lesson(lesson.id),
      queryFn: () => Promise.reject(new Error("fixture transport failure")),
     }),
    ).rejects.toThrow("fixture transport failure");
    const failed = render();
    expect(failed.split(messages.Listening.loadErrorHelp)).toHaveLength(3);
    expect(failed).toContain(messages.Listening.retry);
    expect(failed).not.toContain(messages.Listening.empty);
   } finally {
    queryClient.clear();
   }
  },
 );
});
