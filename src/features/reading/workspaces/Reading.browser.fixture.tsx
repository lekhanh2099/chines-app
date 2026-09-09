import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { TextSectionView } from "@/features/hanzihome/components/lesson-overview/TextSection";
import { TextSectionSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { StrictMode, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { loadAppMessages } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/config";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
import type { ReaderSpeechService } from "@/features/reader/runtime/reader-speech";
import { readerDocumentResponseSchema } from "../model/reading-document.schemas";
import { ReaderDocumentStudy } from "./ReaderDocumentStudy";
import { HskWorkspace } from "@/features/hsk/HskWorkspace";
import { DailyReadingView } from "@/features/daily-reading/DailyReadingLibrary";
import { saveDailyReadingArticle } from "@/features/daily-reading/daily-reading-storage.client";
import type { DailyReading } from "@/features/daily-reading/daily-reading.schemas";
import { readerDocumentRowSchema } from "../model/reading-resource.schemas";
import "@/app/globals.css";

let display = DEFAULT_LESSON_DISPLAY_MODE;
const listeners = new Set<() => void>();
const requests: Parameters<ReaderSpeechService["speak"]>[0][] = [];
let resolveSpeech:
 | ((result: Awaited<ReturnType<ReaderSpeechService["speak"]>>) => void)
 | undefined;
const speech: ReaderSpeechService = {
 speak: (input) => {
  requests.push(input);
  return new Promise((resolve) => {
   resolveSpeech = resolve;
  });
 },
 stop: () => resolveSpeech?.({ completed: false, cancelled: true }),
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
  () => display,
 );
 return {
  state: { settings: { lessonTextDisplayMode: value } },
  updateSettings: ({ lessonTextDisplayMode }: { lessonTextDisplayMode: LessonDisplayMode }) => {
   display = lessonTextDisplayMode;
   listeners.forEach((listener) => listener());
  },
 };
}
export function useClientSession() {
 return { userId: "11111111-1111-4111-8111-111111111111", isResolved: true };
}
export function useMandarinReaderSpeechService() {
 return speech;
}
export function useSharedMandarinTts() {
 return { stop: speech.stop, isLoading: false, speakSequence: () => speech.stop() };
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
 return { push: () => {} };
}
export function Link({
 children,
 href,
 className,
}: {
 children: ReactNode;
 href: string;
 className?: string;
}) {
 return (
  <a href={href} className={className}>
   {children}
  </a>
 );
}
export default Link;

const container = document.createElement("div");
container.dataset.appScrollViewport = "true";
container.className = "h-screen overflow-y-auto";
document.body.append(container);
const root = createRoot(container);
const queryClient = new QueryClient({
 defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const harness = {
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
  display = { ...display, autoDetectPinyin };
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
      <ReaderDocumentStudy resource={resource} />
     </NextIntlClientProvider>
    </QueryClientProvider>
   </StrictMode>,
  );
 },
 snapshot: () => ({
  display,
  requests: requests.map(({ segmentId, startOffset }) => ({ segmentId, startOffset })),
 }),
 finish: () => resolveSpeech?.({ completed: true, cancelled: false }),
 unmount: () => root.unmount(),
};
declare global {
 interface Window {
  readingHarness: typeof harness;
 }
}
window.readingHarness = harness;
