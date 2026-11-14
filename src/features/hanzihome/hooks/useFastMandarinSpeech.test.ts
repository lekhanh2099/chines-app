import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
 cleanMandarinSpeechText,
 cleanVietnameseSpeechText,
 fetchMandarinAudioBlob,
 normalizeSpeechRate,
 prefetchMandarinAudio,
 scoreMandarinVoice,
 selectBestMandarinVoice,
 selectBestVietnameseVoice,
 useFastMandarinSpeech,
 FastSpeechSuspendedContext,
} from "./useFastMandarinSpeech";

function createMockVoice(name: string, lang: string): SpeechSynthesisVoice {
 return {
  default: false,
  lang,
  localService: true,
  name,
  voiceURI: name,
 };
}

describe("selectBestMandarinVoice", () => {
 it("prioritizes Tingting over cartoon kid voices on macOS", () => {
  const voices: readonly SpeechSynthesisVoice[] = [
   createMockVoice("Eddy (Chinese (China mainland))", "zh-CN"),
   createMockVoice("Flo (Chinese (China mainland))", "zh-CN"),
   createMockVoice("Grandma (Chinese (China mainland))", "zh-CN"),
   createMockVoice("Grandpa (Chinese (China mainland))", "zh-CN"),
   createMockVoice("Reed (Chinese (China mainland))", "zh-CN"),
   createMockVoice("Rocko (Chinese (China mainland))", "zh-CN"),
   createMockVoice("Sandy (Chinese (China mainland))", "zh-CN"),
   createMockVoice("Shelley (Chinese (China mainland))", "zh-CN"),
   createMockVoice("Tingting", "zh-CN"),
  ];

  const selected = selectBestMandarinVoice(voices);
  expect(selected?.name).toBe("Tingting");
 });

 it("strictly excludes Cantonese / Hong Kong voices", () => {
  const voices: readonly SpeechSynthesisVoice[] = [
   createMockVoice("Sinji", "zh-HK"),
   createMockVoice("Google 粤语（香港）", "zh-HK"),
  ];

  const selected = selectBestMandarinVoice(voices);
  expect(selected).toBeNull();
  const firstVoice = voices[0];
  if (firstVoice) {
   expect(scoreMandarinVoice(firstVoice)).toBeLessThan(0);
  }
 });

 it("prioritizes Google Mandarin Chinese in Chrome", () => {
  const voices: readonly SpeechSynthesisVoice[] = [
   createMockVoice("Google US English", "en-US"),
   createMockVoice("Google 普通话（中国大陆）", "zh-CN"),
   createMockVoice("Google 粤语（香港）", "zh-HK"),
  ];

  const selected = selectBestMandarinVoice(voices);
  expect(selected?.name).toBe("Google 普通话（中国大陆）");
 });

 it("prioritizes Microsoft Natural / Xiaoxiao in Windows / Edge", () => {
  const voices: readonly SpeechSynthesisVoice[] = [
   createMockVoice("Microsoft David - English (United States)", "en-US"),
   createMockVoice("Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)", "zh-CN"),
  ];

  const selected = selectBestMandarinVoice(voices);
  expect(selected?.name).toBe("Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)");
 });

 it("falls back to Taiwanese Mandarin if no Mainland Mandarin voice is available", () => {
  const voices: readonly SpeechSynthesisVoice[] = [
   createMockVoice("Meijia", "zh-TW"),
   createMockVoice("Alex", "en-US"),
  ];

  const selected = selectBestMandarinVoice(voices);
  expect(selected?.name).toBe("Meijia");
 });

 it("returns null when no Chinese voice is present", () => {
  const voices: readonly SpeechSynthesisVoice[] = [
   createMockVoice("Samantha", "en-US"),
   createMockVoice("Alex", "en-US"),
  ];

  const selected = selectBestMandarinVoice(voices);
  expect(selected).toBeNull();
 });
});

describe("selectBestVietnameseVoice", () => {
 it("finds and returns Vietnamese voice from voices list", () => {
  const voices: readonly SpeechSynthesisVoice[] = [
   createMockVoice("Google US English", "en-US"),
   createMockVoice("Linh", "vi-VN"),
   createMockVoice("Tingting", "zh-CN"),
  ];

  const selected = selectBestVietnameseVoice(voices);
  expect(selected?.name).toBe("Linh");
 });

 it("returns null when no Vietnamese voice is present", () => {
  const voices: readonly SpeechSynthesisVoice[] = [
   createMockVoice("Google US English", "en-US"),
   createMockVoice("Tingting", "zh-CN"),
  ];

  expect(selectBestVietnameseVoice(voices)).toBeNull();
 });
});

describe("fetchMandarinAudioBlob and prefetch", () => {
 it("handles empty string gracefully", async () => {
  const result = await fetchMandarinAudioBlob("   ");
  expect(result).toBeNull();
 });

 it("prefetches multiple texts without throwing", () => {
  expect(() => prefetchMandarinAudio(["面的", "自行车"])).not.toThrow();
 });

 it("normalizes speech rates and cleans Vietnamese / Mandarin text for natural TTS", () => {
  expect(normalizeSpeechRate(0.8)).toBe(0.8);
  expect(normalizeSpeechRate(1.15)).toBe(1.15);
  expect(normalizeSpeechRate(1.2)).toBe(1.2);
  expect(normalizeSpeechRate(0.82)).toBe(0.8);

  expect(cleanVietnameseSpeechText("lên lịch / sắp xếp (排期); đt.")).toBe(
   "lên lịch, sắp xếp, động từ",
  );
  expect(cleanVietnameseSpeechText("VD: gửi file ➔ báo cáo")).toBe("Ví dụ: gửi file, báo cáo");
  expect(cleanMandarinSpeechText('(一) "陈静心里却紧张起来" – "……起来" (……qǐlái)')).toBe(
   '"陈静心里却紧张起来" – "，起来"',
  );
  expect(cleanMandarinSpeechText("1. Trợ từ kết cấu 的")).toBe("的");
 });
});

describe("useFastMandarinSpeech", () => {
 it("handles SSR / Node environment safely without throwing", () => {
  const hookRef: { current: ReturnType<typeof useFastMandarinSpeech> | null } = { current: null };

  function TestConsumer() {
   hookRef.current = useFastMandarinSpeech();
   return null;
  }

  renderToStaticMarkup(createElement(TestConsumer));

  expect(hookRef.current).not.toBeNull();
  if (hookRef.current) {
   expect(() => hookRef.current?.speak("你好")).not.toThrow();
   expect(() => hookRef.current?.speak(["你好", "世界"])).not.toThrow();
   expect(() => hookRef.current?.stop()).not.toThrow();
  }
 });

 it("calls native speechSynthesis when audio fetch falls back", async () => {
  const captured: { voice: SpeechSynthesisVoice | null } = { voice: null };

  const mockSpeak = vi.fn((utterance: SpeechSynthesisUtterance) => {
   captured.voice = utterance.voice;
  });
  const mockCancel = vi.fn();
  const tingtingVoice = createMockVoice("Tingting", "zh-CN");
  const eddyVoice = createMockVoice("Eddy (Chinese (China mainland))", "zh-CN");

  const mockGetVoices = vi.fn(() => [eddyVoice, tingtingVoice]);

  class MockUtterance {
   text: string;
   lang = "";
   rate = 1;
   voice: SpeechSynthesisVoice | null = null;
   constructor(text: string) {
    this.text = text;
   }
  }

  vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  vi.stubGlobal("window", {
   speechSynthesis: {
    speak: mockSpeak,
    cancel: mockCancel,
    getVoices: mockGetVoices,
   },
  });

  const hookRef: { current: ReturnType<typeof useFastMandarinSpeech> | null } = { current: null };

  function TestConsumer() {
   hookRef.current = useFastMandarinSpeech();
   return null;
  }

  renderToStaticMarkup(createElement(TestConsumer));

  if (hookRef.current) {
   hookRef.current.speak(["自行车", "面的"]);
   expect(mockCancel).toHaveBeenCalled();

   // Allow microtasks for async fallback to execute
   await new Promise((resolve) => setTimeout(resolve, 50));

   expect(mockSpeak).toHaveBeenCalled();
   expect(captured.voice?.name).toBe("Tingting");

   hookRef.current.stop();
   expect(mockCancel.mock.calls.length).toBeGreaterThanOrEqual(2);
  }

  vi.unstubAllGlobals();
 });
});

describe("useFastMandarinSpeech overlapping playback", () => {
 // Browser-like audio element: play() stays pending until the test settles it,
 // and pause() rejects a pending play() the way real media elements do.
 class PendingPlayAudio {
  static instances: PendingPlayAudio[] = [];
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  rejectPlay: (error: Error) => void = () => {};
  constructor() {
   PendingPlayAudio.instances.push(this);
  }
  play() {
   return new Promise<void>((_, reject) => {
    this.rejectPlay = reject;
   });
  }
  pause() {
   this.rejectPlay(new Error("The play() request was interrupted by a call to pause()."));
  }
  removeAttribute() {}
 }

 function setup() {
  PendingPlayAudio.instances = [];
  const nativeSpeak = vi.fn();
  vi.stubGlobal("Audio", PendingPlayAudio);
  vi.stubGlobal("URL", { createObjectURL: () => "blob:audio", revokeObjectURL: () => {} });
  vi.stubGlobal(
   "fetch",
   vi.fn(async () => new Response(new Blob(["audio"], { type: "audio/mpeg" }))),
  );
  vi.stubGlobal(
   "SpeechSynthesisUtterance",
   class {
    text: string;
    constructor(text: string) {
     this.text = text;
    }
   },
  );
  vi.stubGlobal("window", {
   speechSynthesis: { speak: nativeSpeak, cancel: vi.fn(), getVoices: () => [] },
  });
  const hookRef: { current: ReturnType<typeof useFastMandarinSpeech> | null } = { current: null };
  function TestConsumer() {
   hookRef.current = useFastMandarinSpeech();
   return null;
  }
  renderToStaticMarkup(createElement(TestConsumer));
  if (!hookRef.current) throw new Error("Expected the speech hook.");
  return { speech: hookRef.current, nativeSpeak };
 }

 async function waitForAudio(count: number) {
  await vi.waitFor(() => expect(PendingPlayAudio.instances).toHaveLength(count));
 }

 it("does not re-read the previous card with the native voice after moving on", async () => {
  const { speech, nativeSpeak } = setup();

  speech.speak(["今天是大年三十。"]);
  await waitForAudio(1);
  speech.speak(["春节"]);
  await waitForAudio(2);
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(nativeSpeak).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
 });

 it("stays silent inside a suspended (hidden, still mounted) study card", async () => {
  setup();
  const fetchMock = vi.fn(async () => new Response(new Blob(["audio"], { type: "audio/mpeg" })));
  vi.stubGlobal("fetch", fetchMock);
  const hookRef: { current: ReturnType<typeof useFastMandarinSpeech> | null } = { current: null };
  function SuspendedConsumer() {
   hookRef.current = useFastMandarinSpeech();
   return null;
  }
  renderToStaticMarkup(
   createElement(
    FastSpeechSuspendedContext.Provider,
    { value: true },
    createElement(SuspendedConsumer),
   ),
  );

  hookRef.current?.speak(["今天是大年三十。"]);
  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(fetchMock).not.toHaveBeenCalled();
  expect(PendingPlayAudio.instances).toHaveLength(0);
  vi.unstubAllGlobals();
 });

 it("falls back to the native voice only once when both error paths fire", async () => {
  const { speech, nativeSpeak } = setup();

  speech.speak(["春节"]);
  await waitForAudio(1);
  const audio = PendingPlayAudio.instances[0];
  audio?.onerror?.();
  audio?.rejectPlay(new Error("NotSupportedError"));
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(nativeSpeak).toHaveBeenCalledTimes(1);
  speech.stop();
  vi.unstubAllGlobals();
 });
});
