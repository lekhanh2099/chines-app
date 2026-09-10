import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
 getPreferredChineseVoice,
 isOfflineSpeechSupported,
 speakChineseOffline,
 stopOfflineSpeech,
} from "./offline-speech-fallback";

class MockSpeechSynthesisVoice implements SpeechSynthesisVoice {
 default = false;
 localService = true;
 name: string;
 lang: string;
 voiceURI: string;

 constructor(name: string, lang: string) {
  this.name = name;
  this.lang = lang;
  this.voiceURI = `${name}-${lang}`;
 }
}

class MockSpeechSynthesisUtterance {
 text: string;
 lang = "";
 rate = 1;
 pitch = 1;
 volume = 1;
 voice: SpeechSynthesisVoice | null = null;
 onstart: (() => void) | null = null;
 onend: (() => void) | null = null;
 onerror: ((event: { error: string }) => void) | null = null;

 constructor(text: string) {
  this.text = text;
 }
}

describe("offline-speech-fallback", () => {
 beforeEach(() => {
  vi.restoreAllMocks();
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 describe("isOfflineSpeechSupported", () => {
  it("returns false when window has no speechSynthesis", () => {
   vi.stubGlobal("window", {});
   expect(isOfflineSpeechSupported()).toBe(false);
  });

  it("returns true when speechSynthesis and Utterance exist", () => {
   vi.stubGlobal("window", {
    speechSynthesis: { getVoices: vi.fn() },
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
   });
   expect(isOfflineSpeechSupported()).toBe(true);
  });
 });

 describe("getPreferredChineseVoice", () => {
  it("finds exact zh-CN voice if present", () => {
   const voices: SpeechSynthesisVoice[] = [
    new MockSpeechSynthesisVoice("Alex", "en-US"),
    new MockSpeechSynthesisVoice("Tingting", "zh-CN"),
   ];

   vi.stubGlobal("window", {
    speechSynthesis: { getVoices: () => voices },
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
   });

   const voice = getPreferredChineseVoice();
   expect(voice?.name).toBe("Tingting");
  });

  it("falls back to generic zh voice if zh-CN is not present", () => {
   const voices: SpeechSynthesisVoice[] = [
    new MockSpeechSynthesisVoice("Alex", "en-US"),
    new MockSpeechSynthesisVoice("Sinji", "zh-HK"),
   ];

   vi.stubGlobal("window", {
    speechSynthesis: { getVoices: () => voices },
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
   });

   const voice = getPreferredChineseVoice();
   expect(voice?.name).toBe("Sinji");
  });
 });

 describe("stopOfflineSpeech", () => {
  it("calls window.speechSynthesis.cancel", () => {
   const cancelMock = vi.fn();
   vi.stubGlobal("window", {
    speechSynthesis: { cancel: cancelMock, getVoices: () => [] },
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
   });

   stopOfflineSpeech();
   expect(cancelMock).toHaveBeenCalledOnce();
  });
 });

 describe("speakChineseOffline", () => {
  it("resolves immediately for empty string", async () => {
   const result = await speakChineseOffline("   ");
   expect(result).toEqual({ completed: true, cancelled: false, usedFallback: false });
  });

  it("synthesizes speech and resolves onend event", async () => {
   const capturedUtterances: MockSpeechSynthesisUtterance[] = [];
   const cancelMock = vi.fn();
   const speakMock = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
    capturedUtterances.push(utterance);
    setTimeout(() => {
     utterance.onstart?.();
     utterance.onend?.();
    }, 10);
   });

   vi.stubGlobal("window", {
    speechSynthesis: {
     cancel: cancelMock,
     speak: speakMock,
     getVoices: () => [new MockSpeechSynthesisVoice("Tingting", "zh-CN")],
    },
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
   });

   const onStart = vi.fn();
   const onEnd = vi.fn();

   const result = await speakChineseOffline("你好", {
    rate: 1.2,
    onStart,
    onEnd,
   });

   expect(cancelMock).toHaveBeenCalled();
   expect(speakMock).toHaveBeenCalled();
   expect(onStart).toHaveBeenCalled();
   expect(onEnd).toHaveBeenCalled();
   expect(result).toEqual({ completed: true, cancelled: false, usedFallback: true });
   expect(capturedUtterances[0]?.rate).toBe(1.2);
  });

  it("handles cancellation without calling onError", async () => {
   const onError = vi.fn();

   vi.stubGlobal("window", {
    speechSynthesis: {
     cancel: vi.fn(),
     speak: (utterance: MockSpeechSynthesisUtterance) => {
      setTimeout(() => {
       utterance.onerror?.({ error: "canceled" });
      }, 10);
     },
     getVoices: () => [],
    },
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
   });

   const result = await speakChineseOffline("你好", { onError });

   expect(onError).not.toHaveBeenCalled();
   expect(result).toEqual({ completed: false, cancelled: true, usedFallback: true });
  });
 });
});
