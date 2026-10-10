import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.generated";
import type { useClientSession as actualSession } from "@/components/providers/QueryProvider";
import { TooltipProvider } from "@/components/ui/overlays/tooltip";
import { HanziHomeLibraryHome } from "@/features/hanzihome/HanziHomeLibraryHome";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { PageContainer } from "@/components/layout/workspace/page-container";
import { TextSectionView } from "@/features/hanzihome/components/lesson-overview/TextSection";
import { TextSectionSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { BusinessChineseStudyWorkspace } from "@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace";
import {
 getTextbookCatalog,
 getTextbookLesson,
 type TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";
import { buildTextbookHref } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { useLearningState as actualUseLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 Profiler,
 StrictMode,
 useEffect,
 useState,
 useSyncExternalStore,
 type ComponentProps,
 type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { loadAppMessages } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/config";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { ReaderSpeechService } from "@/features/reader/runtime/reader-speech";
import type { useTTS } from "@/hooks/useTTS";
import { readerDocumentResponseSchema } from "../model/reading-document.schemas";
import { ReaderDocumentStudy } from "./ReaderDocumentStudy";
import { HskWorkspace } from "@/features/hsk/HskWorkspace";
import { DailyReadingView } from "@/features/daily-reading/components/DailyReadingLibrary";
import { saveDailyReadingArticle } from "@/features/daily-reading/local/daily-reading-storage.client";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";
import { readerDocumentRowSchema } from "../model/reading-resource.schemas";
import { Reader as ActualReader } from "../../reader/components/Reader";
import { cookReaderData as actualCookReaderData } from "../../reader/model/cook-reader-data";
import { analyzeContextualPronunciation as actualAnalyzeContextualPronunciation } from "../../hanzihome/pronunciation/contextual-pronunciation";
export * from "../../hanzihome/pronunciation/contextual-pronunciation";
import "@/app/globals.css";

let learningState: ReturnType<typeof actualUseLearningState>["state"] = {
 ...emptyLearningState,
 settings: { lessonTextDisplayMode: DEFAULT_LESSON_DISPLAY_MODE },
};
const listeners = new Set<() => void>();
const navigationRequests: string[] = [];
const routePrefetches: string[] = [];
const supabase = createClient<Database>(window.location.origin, "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
let libraryMount = 0;
let learningLoading = false;
const requests: Parameters<ReaderSpeechService["speak"]>[0][] = [];
let resolveSpeech:
 | ((result: Awaited<ReturnType<ReaderSpeechService["speak"]>>) => void)
 | undefined;
let settleSharedSpeech = () => {};
let speechStops = 0;
let cookerCalls = 0;
let analysisCalls = 0;
const readerCommits: number[] = [];
export const cookReaderData: typeof actualCookReaderData = (...args) => {
 cookerCalls += 1;
 return actualCookReaderData(...args);
};
export const analyzeContextualPronunciation: typeof actualAnalyzeContextualPronunciation = (
 ...args
) => {
 analysisCalls += 1;
 return actualAnalyzeContextualPronunciation(...args);
};
export function Reader(props: ComponentProps<typeof ActualReader>) {
 return (
  <Profiler id="reader" onRender={(_id, _phase, duration) => readerCommits.push(duration)}>
   <ActualReader {...props} />
  </Profiler>
 );
}
const speech: ReaderSpeechService = {
 speak: (input) => {
  settleSharedSpeech();
  requests.push(input);
  return new Promise((resolve) => {
   resolveSpeech = resolve;
  });
 },
 stop: () => {
  speechStops += 1;
  settleSharedSpeech();
  resolveSpeech?.({ completed: false, cancelled: true });
 },
 pause: () => {},
 resume: () => {},
};

// Only external app/session/audio dependencies are replaced. Reading hooks,
// facade, store, panels, queries and HTTP client contracts are the production modules.
export function useLearningState() {
 const value = useSyncExternalStore(
  (listener) => {
   listeners.add(listener);
   return () => {
    listeners.delete(listener);
   };
  },
  () => learningState,
 );
 return {
  state: value,
  isLoading: learningLoading,
  updateSettings: (
   settings: Parameters<ReturnType<typeof actualUseLearningState>["updateSettings"]>[0],
  ) => {
   learningState = {
    ...learningState,
    settings: {
     ...learningState.settings,
     ...settings,
     bookDisplayModes: { ...learningState.settings.bookDisplayModes, ...settings.bookDisplayModes },
     bookResume: { ...learningState.settings.bookResume, ...settings.bookResume },
    },
   };
   listeners.forEach((listener) => listener());
  },
  toggleBookmark: (
   ...[scope, id]: Parameters<ReturnType<typeof actualUseLearningState>["toggleBookmark"]>
  ) => {
   const current = learningState.bookmarks[scope] ?? [];
   learningState = {
    ...learningState,
    bookmarks: {
     ...learningState.bookmarks,
     [scope]: current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    },
   };
   listeners.forEach((listener) => listener());
  },
 };
}
export function useClientSession(): ReturnType<typeof actualSession> {
 return { supabase, user: null, userId: "11111111-1111-4111-8111-111111111111", isResolved: true };
}
export function useMandarinReaderSpeechService() {
 return speech;
}
export function MandarinTtsProvider({ children }: { children: ReactNode }) {
 return children;
}
export function useSharedMandarinTts() {
 return {
  stop: speech.stop,
  isLoading: false,
  rate: 1,
  speakSequence: () => speech.stop(),
  speakWithLifecycle: (
   _text: Parameters<ReturnType<typeof useTTS>["speakWithLifecycle"]>[0],
   options: Parameters<ReturnType<typeof useTTS>["speakWithLifecycle"]>[1],
  ): ReturnType<ReturnType<typeof useTTS>["speakWithLifecycle"]> => {
   speech.stop();
   return new Promise((resolve) => {
    settleSharedSpeech = () => {
     settleSharedSpeech = () => {};
     options.onSettled?.();
     resolve({ completed: false, cancelled: true });
    };
   });
  },
 };
}
export function useMandarinTtsControls() {
 return { ...useSharedMandarinTts(), isSpeaking: false, speakingRequestText: null };
}
export function useVocabInspector() {
 return { openInspector: () => {} };
}
export function useSearchParams() {
 return new URLSearchParams(window.location.search);
}
export function usePathname() {
 return window.location.pathname.startsWith("/hsk") ? window.location.pathname : "/reader";
}
export function useRouter() {
 return {
  prefetch: (href: string) => routePrefetches.push(href),
  push: (href: string) => navigationRequests.push(href),
  replace: (href: string) => navigationRequests.push(href),
 };
}
export function Link(props: ComponentProps<"a">) {
 return <a {...props} />;
}
export default Link;

window.readingHarness?.unmount();
document.querySelectorAll("[data-app-scroll-viewport]").forEach((node) => node.remove());
const container = document.createElement("div");
container.dataset.appScrollViewport = "true";
container.className = "h-screen overflow-y-auto";
document.body.append(container);
const root = createRoot(container);
const queryClient = new QueryClient({
 defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const controls = { refresh: () => {} };
function ParentProbe(props: ComponentProps<typeof ReaderDocumentStudy>) {
 const [render, setRender] = useState(0);
 useEffect(() => {
  controls.refresh = () => setRender((current) => current + 1);
  return () => {
   controls.refresh = () => {};
  };
 }, []);
 return (
  <section data-parent-render={render}>
   <ReaderDocumentStudy {...props} />
  </section>
 );
}
const harness = {
 async mountLibrary(locale: AppLocale = "vi", recent = false, isLoading = false) {
  libraryMount += 1;
  learningLoading = isLoading;
  queryClient.clear();
  routePrefetches.length = 0;
  learningState = {
   ...emptyLearningState,
   settings: recent
    ? { lastCourseId: "course-a", lastLessonId: "lesson-a1", lastModule: "grammar" }
    : {},
  };
  listeners.forEach((listener) => listener());
  const messages = await loadAppMessages(locale);
  root.render(
   <StrictMode>
    <QueryClientProvider client={queryClient}>
     <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <TooltipProvider>
       <HanziHomeLibraryHome key={libraryMount} />
      </TooltipProvider>
     </NextIntlClientProvider>
    </QueryClientProvider>
   </StrictMode>,
  );
 },
 refreshLibrary: () =>
  queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalog(true, false) }),

 async mountBusiness(
  bookKey: TextbookLesson["bookKey"] = "doc-hieu",
  locale: AppLocale = "vi",
  view = "practice",
 ) {
  const lesson = getTextbookLesson(bookKey, 1);
  if (!lesson) throw new Error("Missing textbook lesson");
  const messages = await loadAppMessages(locale);
  window.history.replaceState(null, "", `${buildTextbookHref(bookKey, 1)}&tab=${view}`);
  root.render(
   <StrictMode>
    <QueryClientProvider client={queryClient}>
     <NextIntlClientProvider locale={locale} messages={messages}>
      <BusinessChineseStudyWorkspace
       key={`${bookKey}:${locale}:${view}`}
       books={getTextbookCatalog()}
       lesson={lesson}
      />
     </NextIntlClientProvider>
    </QueryClientProvider>
   </StrictMode>,
  );
 },
 async mountTextbook() {
  const messages = await loadAppMessages("vi");
  const section = TextSectionSchema.parse({
   id: "textbook-text",
   type: "text",
   order: 1,
   title: "课文",
   title_vi: "Bài khóa",
   blocks: [
    {
     id: "textbook-story",
     type: "text_narrative",
     order: 1,
     title: "城市",
     paragraphs: [
      {
       id: "textbook-p1",
       order: 1,
       zh: "城市举办文化活动。",
       pinyin: "chéng shì jǔ bàn wén huà huó dòng",
       vi: "Thành phố tổ chức hoạt động văn hóa.",
      },
      { id: "textbook-p2", order: 2, zh: "年轻读者来到现场。", vi: "Độc giả trẻ đến hiện trường." },
     ],
    },
   ],
  });
  root.render(
   <StrictMode>
    <QueryClientProvider client={queryClient}>
     <NextIntlClientProvider locale="vi" messages={messages}>
      <PageContainer>
       <TextSectionView section={section} displayMode={DEFAULT_LESSON_DISPLAY_MODE} />
      </PageContainer>
     </NextIntlClientProvider>
    </QueryClientProvider>
   </StrictMode>,
  );
 },
 async mountDaily(reading: DailyReading, autoDetectPinyin = false) {
  learningState = {
   ...learningState,
   settings: {
    ...learningState.settings,
    lessonTextDisplayMode: {
     ...(learningState.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE),
     autoDetectPinyin,
    },
   },
  };
  listeners.forEach((listener) => listener());
  saveDailyReadingArticle(reading);
  const messages = await loadAppMessages("vi");
  window.history.replaceState(null, "", "/daily-reading");
  root.render(
   <StrictMode>
    <QueryClientProvider client={queryClient}>
     <NextIntlClientProvider locale="vi" messages={messages}>
      <PageContainer>
       <DailyReadingView id={reading.id} onBack={() => {}} />
      </PageContainer>
     </NextIntlClientProvider>
    </QueryClientProvider>
   </StrictMode>,
  );
 },
 async mountHsk(slug: string = "") {
  const response = await fetch("/hsk-documents");
  const documents = readerDocumentRowSchema.array().parse(await response.json());
  const resourceResponse = await fetch("/hsk-resource");
  const resource = readerDocumentResponseSchema.parse(await resourceResponse.json());
  const messages = await loadAppMessages("vi");
  window.history.replaceState(null, "", slug ? `/hsk/${slug}` : "/hsk");
  root.render(
   <StrictMode>
    <QueryClientProvider client={queryClient}>
     <NextIntlClientProvider locale="vi" messages={messages}>
      <PageContainer>
       <HskWorkspace
        initialDocumentSlug={slug}
        initialDocuments={documents}
        initialResource={slug ? resource : null}
       />
      </PageContainer>
     </NextIntlClientProvider>
    </QueryClientProvider>
   </StrictMode>,
  );
 },
 async mount(locale: AppLocale = "vi") {
  const response = await fetch("/reading-resource");
  const resource = readerDocumentResponseSchema.parse(await response.json());
  const messages = await loadAppMessages(locale);
  root.render(
   <StrictMode>
    <QueryClientProvider client={queryClient}>
     <NextIntlClientProvider locale={locale} messages={messages}>
      <ParentProbe resource={resource} />
     </NextIntlClientProvider>
    </QueryClientProvider>
   </StrictMode>,
  );
 },
 snapshot: () => ({
  display: learningState.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE,
  learningState,
  navigationRequests: [...navigationRequests],
  routePrefetches: [...routePrefetches],
  requests: requests.map(({ segmentId, startOffset }) => ({ segmentId, startOffset })),
 }),
 finish: () => resolveSpeech?.({ completed: true, cancelled: false }),
 refresh: () => controls.refresh(),
 resetMetrics: () => {
  readerCommits.length = 0;
  cookerCalls = 0;
  analysisCalls = 0;
 },
 metrics: () => ({ readerCommits: [...readerCommits], cookerCalls, analysisCalls, speechStops }),
 unmount: () => root.unmount(),
};
declare global {
 interface Window {
  readingHarness: typeof harness;
 }
}
window.readingHarness = harness;
