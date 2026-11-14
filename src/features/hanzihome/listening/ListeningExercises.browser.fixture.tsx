import { createRoot } from "react-dom/client";
import type { ComponentProps } from "react";
import { useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../../messages/vi/listening.json";
import { DEFAULT_LESSON_DISPLAY_MODE } from "../components/lesson-overview/types";
import { ListeningExerciseItems } from "./ListeningExerciseItems";
import type { ListeningRuntimeItem } from "./listening.types";
import { DictationCards } from "./ListeningDictationWorkspace";
import { externalDictationEntry } from "@/features/dictation/dictation-workspace-utils";
import type { DictationAttempt } from "@/features/dictation/dictation-session";
import { StudioDictationEditor } from "@/features/dictation/StudioDictationEditor";
import dictationMessages from "../../../../messages/vi/dictation.json";
import type { useClientSession as sessionHook } from "@/components/providers/QueryProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.generated";
import type {
 usePathname as navigationPathname,
 useRouter as navigationRouter,
} from "@/i18n/navigation";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import { StudioDictationWorkspace } from "@/features/dictation/StudioDictationWorkspace";
import { listeningQueryKeys } from "./listening.query-keys";
import type { ListeningLessonBundle } from "./listening.types";
import { generateSmartPinyin as actualGenerateSmartPinyin } from "../../../lib/pronunciation/pinyin-engine";

const supabase = createClient<Database>(window.location.origin, "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false },
});
export const usePathname: typeof navigationPathname = () => "/dictation";
const fixtureRouter: ReturnType<typeof navigationRouter> = {
 push: () => {},
 replace: () => {},
 prefetch: () => {},
 back: () => {},
 forward: () => {},
 refresh: () => {},
 bfcacheId: "dictation-fixture",
};
export const useRouter: typeof navigationRouter = () => fixtureRouter;
export const useSearchParams = () => new URLSearchParams();
const pinyinSamples: { characters: number; durationMs: number }[] = [];
export const generateSmartPinyin: typeof actualGenerateSmartPinyin = (...args) => {
 const startedAt = performance.now();
 const result = actualGenerateSmartPinyin(...args);
 pinyinSamples.push({ characters: args[0].length, durationMs: performance.now() - startedAt });
 return result;
};

// The fixture pins Study mode; production UI and grading utilities remain real.
export function useHanziHomeEditMode() {
 return false;
}
export function useHanziHomeFeatureActions() {
 return { openEditableNode: () => {} };
}
export function useClientSession(): ReturnType<typeof sessionHook> {
 return { supabase, user: null, userId: null, isResolved: true };
}
const blank: ListeningRuntimeItem = {
 id: "blank",
 sectionId: "fixture",
 order: 1,
 type: "fill_blank",
 options: [],
 metadata: { promptParts: ["我喜欢", "。"], acceptedAnswers: ["学习"] },
};
const matching: ListeningRuntimeItem = {
 id: "matching",
 sectionId: "fixture",
 order: 2,
 type: "matching",
 options: [],
 metadata: {
  left: [{ id: "left", textZh: "水", textVi: "Nước" }],
  right: [{ id: "right", textZh: "河", textVi: "Sông" }],
 },
 answer: { type: "matching", pairs: [{ left: "left", right: "right" }] },
};
const common = {
 showPinyin: false,
 showMeaning: false,
 showScript: false,
 hideScriptBeforeCheck: true,
 showTranslationAfterCheck: true,
 displayMode: DEFAULT_LESSON_DISPLAY_MODE,
 onSpeak: () => {},
 onSpeakSequence: () => {},
 lessonId: "fixture",
};
const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
const dictationEntries = [
 externalDictationEntry("one", "你好。", "One", "nǐ hǎo"),
 externalDictationEntry("two", "谢谢！", "Two", "xiè xie"),
];
const speeches: string[][] = [];
const attempts: DictationAttempt[] = [];
const studioAttempts: DictationAttempt[] = [];
const studioNavigation: string[] = [];
function StudioEditorFixture() {
 const [index, setIndex] = useState(0);
 const entry = dictationEntries[index];
 if (!entry) throw new Error("Missing Studio fixture entry");
 return (
  <section aria-label="Studio editor fixture">
   <StudioDictationEditor
    entry={entry}
    index={index}
    total={dictationEntries.length}
    onAttempt={(attempt) => studioAttempts.push(attempt)}
    onNext={() => {
     studioNavigation.push(`next:${entry.id}`);
     setIndex((current) => Math.min(dictationEntries.length - 1, current + 1));
    }}
    onPrevious={() => {
     studioNavigation.push(`previous:${entry.id}`);
     setIndex((current) => Math.max(0, current - 1));
    }}
    onPlayToggle={() => {}}
    onRepeat={() => {}}
   />
  </section>
 );
}
function mountStudio() {
 root.render(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Dictation: dictationMessages }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <StudioEditorFixture />
  </NextIntlClientProvider>,
 );
}
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
function mountWorkspace(seedBundle = true, emptyLessons = false) {
 const lessons: ComponentProps<typeof StudioDictationWorkspace>["initialDictationLessons"] = [
  {
   id: "fixture",
   bookId: "book",
   bookTitle: "Fixture book",
   lessonNumber: 1,
   titleZh: "朋友",
   title: "Bạn",
   vocabIds: [],
   grammarPointIds: [],
   vocab: [],
   grammar: [],
  },
 ];
 const bundle: ListeningLessonBundle = {
  lesson: { id: "fixture", titleZh: "朋友" },
  sections: [],
  items: [],
 };
 if (seedBundle) queryClient.setQueryData(listeningQueryKeys.lesson("fixture"), bundle);
 root.render(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Dictation: dictationMessages }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <QueryClientProvider client={queryClient}>
    <MandarinTtsProvider>
     <StudioDictationWorkspace
      initialDictationLessons={emptyLessons ? [] : lessons}
      initialReaderDocuments={[]}
      initialReaderResource={null}
      initialReaderCourseResource={null}
     />
    </MandarinTtsProvider>
   </QueryClientProvider>
  </NextIntlClientProvider>,
 );
}
let currentTime = 1000;
function mountDictation(
 playbackMode: ComponentProps<typeof DictationCards>["playbackMode"],
 activeEntryId?: ComponentProps<typeof DictationCards>["activeEntryId"],
) {
 Date.now = () => currentTime;
 root.render(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Listening: messages }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <section aria-label="Dictation fixture">
    <DictationCards
     entries={dictationEntries}
     displayMode={DEFAULT_LESSON_DISPLAY_MODE}
     onSpeak={(text) => speeches.push([text])}
     onSpeakSequence={(texts) => speeches.push(texts)}
     onAttempt={(attempt) => attempts.push(attempt)}
     playbackMode={playbackMode}
     passageText="你好。\n谢谢！"
     activeEntryId={activeEntryId}
    />
   </section>
  </NextIntlClientProvider>,
 );
}
const harness = {
 mountDictation,
 mountStudio,
 mountWorkspace,
 resetPinyinSamples: () => {
  pinyinSamples.length = 0;
 },
 pinyinSamples: () => [...pinyinSamples],
 unmount: () => {
  root.render(null);
  queryClient.clear();
 },
 studioSnapshot: () => ({ attempts: studioAttempts, navigation: studioNavigation }),
 setTime(value: number) {
  currentTime = value;
 },
 snapshot: () => ({ speeches, attempts }),
};
declare global {
 interface Window {
  listeningHarness: typeof harness;
 }
}
window.listeningHarness = harness;
root.render(
 <NextIntlClientProvider locale="vi" messages={{ Listening: messages }} timeZone="Asia/Ho_Chi_Minh">
  <section aria-label="Fill answer fixture">
   <ListeningExerciseItems {...common} exerciseType="fill_blank" items={[blank]} />
  </section>
  <section aria-label="Matching fixture">
   <ListeningExerciseItems {...common} exerciseType="matching" items={[matching]} />
  </section>
 </NextIntlClientProvider>,
);
