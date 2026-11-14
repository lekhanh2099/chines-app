import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { loadAppMessages } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/config";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import { TtsStudioWorkspace } from "@/features/hanzihome/tts/TtsStudioWorkspace";
import { StudioDictationWorkspace } from "./StudioDictationWorkspace";
import { StudioDictationPracticePanel } from "./StudioDictationPracticePanel";
import { StudioDictationReferencePanel } from "./StudioDictationReferencePanel";
import { externalDictationEntry } from "./dictation-workspace-utils";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/i18n/navigation", () => ({
 usePathname: () => "/dictation",
 useRouter: () => ({ push: () => {} }),
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: null, isResolved: true }),
}));
const cases = [
 {
  locale: "vi",
  heading: "Phòng chép chính tả",
  compose: "Soạn nội dung, nghe thử, rồi xuất MP3",
  prompt: "Bạn nghe được gì?",
  settings: "Cài đặt",
  voice: "Tùy chỉnh giọng đọc",
 },
 {
  locale: "en",
  heading: "Dictation studio",
  compose: "Compose, preview, and export MP3",
  prompt: "What did you hear?",
  settings: "Settings",
  voice: "Voice settings",
 },
 {
  locale: "zh-CN",
  heading: "听写工作室",
  compose: "编写内容、试听并导出 MP3",
  prompt: "您听到了什么？",
  settings: "设置",
  voice: "语音设置",
 },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 heading: string;
 compose: string;
 prompt: string;
 settings: string;
 voice: string;
}>;
const noop = () => {};
describe("Dictation and TTS locale wiring", () => {
 it.each(cases)(
  "renders workspace, controls, editor and reference chrome in $locale",
  async (item) => {
   const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
   const messages = await loadAppMessages(item.locale);
   const entry = externalDictationEntry("fixture", "你好。", "学习内容", "nǐ hǎo");
   entry.transcript.full.vi = "Nội dung học giữ nguyên";
   try {
    const markup = renderToStaticMarkup(
     <NextIntlClientProvider locale={item.locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
      <QueryClientProvider client={client}>
       <MandarinTtsProvider>
        <TtsStudioWorkspace sourceText="你好。" />
        <StudioDictationWorkspace
         initialReaderDocuments={[]}
         initialReaderResource={null}
         initialReaderCourseResource={null}
         initialDictationLessons={[]}
        />
        <StudioDictationPracticePanel
         activeIndex={0}
         autoAdvance={false}
         checkedCount={0}
         entries={[entry]}
         isLoading={false}
         isPaused={false}
         isSpeaking={false}
         loopCurrent={false}
         rate={1}
         scriptMode="hidden"
         selectedVoiceName=""
         voices={[]}
         onAttempt={noop}
         onAutoAdvanceChange={noop}
         onLoopCurrentChange={noop}
         onNext={noop}
         onPlayToggle={noop}
         onPrevious={noop}
         onRateChange={noop}
         onRepeat={noop}
         onScriptModeChange={noop}
         onSelect={noop}
         onStop={noop}
         onVoiceChange={noop}
        />
        <StudioDictationReferencePanel
         activeIndex={0}
         entries={[entry]}
         isPlaybackActive={false}
         sourceLabel="学习内容"
         titleVi="Nội dung học"
         titleZh="学习内容"
        />
       </MandarinTtsProvider>
      </QueryClientProvider>
     </NextIntlClientProvider>,
    );
    for (const text of [
     item.heading,
     item.compose,
     item.prompt,
     item.settings,
     item.voice,
     "你好。",
     "Nội dung học giữ nguyên",
    ])
     expect(markup).toContain(text);
    expect(markup).not.toContain("TtsStudio.");
    expect(markup).not.toContain("Dictation.");
    if (item.locale !== "vi") {
     expect(markup).not.toContain("Phòng chép chính tả");
     expect(markup).not.toContain("Bạn nghe được gì?");
    }
   } finally {
    client.clear();
   }
  },
 );
});
