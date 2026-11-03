import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
 scoreMandarinVoice,
 selectBestMandarinVoice,
 useFastMandarinSpeech,
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
   expect(() => hookRef.current?.stop()).not.toThrow();
  }
 });

 it("calls native speechSynthesis with selected Mandarin voice", () => {
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
   hookRef.current.speak("自行车");
   expect(mockCancel).toHaveBeenCalled();
   expect(mockSpeak).toHaveBeenCalled();

   // Verify the utterance passed to synth.speak had Tingting assigned, NOT Eddy
   expect(captured.voice?.name).toBe("Tingting");

   hookRef.current.stop();
   expect(mockCancel).toHaveBeenCalledTimes(2);
  }

  vi.unstubAllGlobals();
 });
});
