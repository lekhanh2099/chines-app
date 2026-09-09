import { NextIntlClientProvider } from "next-intl";
import { StrictMode, memo, useLayoutEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { loadAppMessages } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/config";
import { analyzeContextualPronunciation } from "@/lib/pronunciation/contextual-pronunciation";
import { Typography } from "@/components/ui/typography";
import { scrollAppContentToElement } from "@/components/layout/app-scroll";
import "@/app/globals.css";
import { Reader } from "../components/Reader";
import { cookReaderData } from "../model/cook-reader-data";
import type { ReaderDataInput } from "../model/reader.schemas";
import { ReaderProvider } from "./ReaderProvider";
import {
 useReaderCommands,
 useReaderPlaybackProgress,
 useReaderRegistry,
 useReaderSegment,
 useReaderSegmentIsActive,
 useReaderStore,
 useReaderSelector,
} from "./reader-context";
import type { ReaderCommands } from "./reader-playback";
import type { ReaderSpeechService } from "./reader-speech";
import type { ReaderStore } from "./reader-store";
import { captureReaderSelection } from "./reader-selection";

function IntegratedWorkspace({ children }: { children: ReactNode }) {
 const activeId = useReaderSelector((state) => state.navigation.activeSegmentId);
 return <div data-workspace-active={activeId}>{children}</div>;
}

function createHarness() {
 const container = document.createElement("div");
 container.className = "h-screen overflow-y-auto";
 container.dataset.appScrollViewport = "true";
 document.body.append(container);
 const root = createRoot(container);
 const captured: { store?: ReaderStore; commands?: ReaderCommands } = {};
 const counts = new Map<string, number>();
 const pending: {
  input: Parameters<ReaderSpeechService["speak"]>[0];
  resolve: (result: Awaited<ReturnType<ReaderSpeechService["speak"]>>) => void;
 }[] = [];
 const stops = { first: 0, second: 0 };
 const lookups: string[] = [];
 const annotationActions: string[] = [];
 const reviews: string[] = [];
 const speech: ReaderSpeechService = {
  speak: (input) => new Promise((resolve) => pending.push({ input, resolve })),
  stop: () => {
   stops.first += 1;
  },
 };
 const replacement: ReaderSpeechService = {
  speak: (input) => new Promise((resolve) => pending.push({ input, resolve })),
  stop: () => {
   stops.second += 1;
  },
 };
 const Probe = memo(function Probe({ id }: { id: string }) {
  const segment = useReaderSegment(id);
  const active = useReaderSegmentIsActive(id);
  const progress = useReaderPlaybackProgress(id);
  const registry = useReaderRegistry();
  const store = useReaderStore();
  const commands = useReaderCommands();
  useLayoutEffect(() => {
   captured.store = store;
   captured.commands = commands;
  }, [store, commands]);
  counts.set(id, (counts.get(id) ?? 0) + 1);
  return (
   <div
    ref={(element) => registry.set(id, element)}
    data-probe={id}
    data-active={active}
    data-progress={progress}
   >
    <Typography>{segment?.zh}</Typography>
   </div>
  );
 });
 const data = [
  { id: "a", zh: "你好。" },
  { id: "b", zh: "中国。" },
  { id: "c", zh: "再见。" },
 ];
 let content = cookReaderData(data);
 const renderRuntime = (replaceSpeech = false) => {
  root.render(
   <StrictMode>
    <ReaderProvider content={content} services={{ speech: replaceSpeech ? replacement : speech }}>
     {content.segmentIds.map((id) => (
      <Probe key={id} id={id} />
     ))}
    </ReaderProvider>
   </StrictMode>,
  );
 };
 return {
  mount: renderRuntime,
  useViewport() {
   container.className = "";
   delete container.dataset.appScrollViewport;
  },
  scrollWithDefaultOptions(id: string) {
   const target = container.querySelector<HTMLElement>(`[data-reader-segment="${id}"]`);
   scrollAppContentToElement(target, { behavior: "instant", block: "center" });
  },
  async pair() {
   const messages = await loadAppMessages("vi");
   root.render(
    <NextIntlClientProvider locale="vi" messages={messages}>
     <Reader
      data={[
       { id: "same", zh: "你好。", pinyin: "nǐ hǎo" },
       { id: "next", zh: "第一篇。" },
      ]}
      services={{ speech }}
     />
     <Reader
      data={[
       { id: "same", zh: "再见。", pinyin: "zài jiàn" },
       { id: "next", zh: "第二篇。" },
      ]}
      services={{ speech }}
     />
    </NextIntlClientProvider>,
   );
  },
  async facade(
   input: ReaderDataInput,
   withSpeech = false,
   locale: AppLocale = "vi",
   withAnnotations = false,
  ) {
   const messages = await loadAppMessages(locale);
   root.render(
    <StrictMode>
     <NextIntlClientProvider locale={locale} messages={messages}>
      <Reader
       data={input}
       services={{
        renderReader: ({ content }) => <IntegratedWorkspace>{content}</IntegratedWorkspace>,
        renderSection: ({ section, content }) => (
         <div data-edit-section={section.id}>{content}</div>
        ),
        renderSegment: ({ segment, content }) => (
         <div data-edit-segment={segment.id}>{content}</div>
        ),
        speech: withSpeech ? speech : undefined,
        lookup: (selection) => lookups.push(selection.text),
        annotations: withAnnotations
         ? {
            items: [{ id: "annotation", segmentId: "source", text: "你", start: 0, end: 1 }],
            onOpen: (annotation) => annotationActions.push(annotation.id),
            onSelection: (selection) => annotationActions.push(selection.text),
           }
         : undefined,
        pronunciationReview: withAnnotations
         ? {
            analyses: new Map([
             ["source", analyzeContextualPronunciation({ text: "你好。", sourcePinyin: "nǐ hǎo" })],
            ]),
            onInspect: (target) => reviews.push(target.glyph.text),
           }
         : undefined,
       }}
      />
     </NextIntlClientProvider>
    </StrictMode>,
   );
  },
  select: (id: string) => captured.commands?.selectSegment(id),
  play: () => captured.commands?.playCurrent(),
  progress: (index: number, progress: number) => pending[index]?.input.onProgress?.({ progress }),
  finish: (index: number) => pending[index]?.resolve({ completed: true, cancelled: false }),
  replaceContent: (input: ReaderDataInput) => {
   content = cookReaderData(input);
   renderRuntime();
  },
  snapshot: () => ({
   state: captured.store?.state,
   counts: Object.fromEntries(counts),
   pending: pending.length,
   stops: { ...stops },
   lookups: [...lookups],
   annotationActions: [...annotationActions],
   reviews: [...reviews],
   inputs: pending.map((request) => ({
    segmentId: request.input.segmentId,
    text: request.input.text,
    startOffset: request.input.startOffset,
   })),
  }),
  rubySelection() {
   const wrapper = document.createElement("div");
   wrapper.innerHTML =
    "<span data-reader-source><ruby>你<rp>(</rp><rt>nǐ</rt><rp>)</rp></ruby><span data-reader-pinyin>hǎo</span>好</span>";
   const source = wrapper.firstChild;
   if (!source) throw new Error("Missing selection fixture");
   document.body.append(wrapper);
   const range = document.createRange();
   range.selectNodeContents(source);
   const selection = window.getSelection();
   selection?.removeAllRanges();
   selection?.addRange(range);
   const result = captureReaderSelection(wrapper, { id: "ruby", kind: "sentence", zh: "你好" });
   selection?.removeAllRanges();
   wrapper.remove();
   return result ? { text: result.text, start: result.start, end: result.end } : null;
  },
  unmount: () => root.unmount(),
 };
}

export type ReaderBrowserHarness = ReturnType<typeof createHarness>;
declare global {
 interface Window {
  readerHarness: ReaderBrowserHarness;
 }
}
window.readerHarness = createHarness();
