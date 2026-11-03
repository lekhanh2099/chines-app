import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useFastMandarinSpeech } from "./useFastMandarinSpeech";

const mockSpeakSequence = vi.fn();
const mockStop = vi.fn();

vi.mock("@/features/speech/MandarinTtsProvider", () => ({
 useMandarinTtsControls: () => ({
  isSpeaking: false,
  isLoading: false,
  speakingRequestText: null,
  speakSequence: mockSpeakSequence,
  stop: mockStop,
 }),
}));

describe("useFastMandarinSpeech", () => {
 it("provides stable hook in SSR / Node environment and calls fallback TTS", () => {
  const hookRef: { current: ReturnType<typeof useFastMandarinSpeech> | null } = { current: null };

  function TestConsumer() {
   hookRef.current = useFastMandarinSpeech();
   return null;
  }

  renderToStaticMarkup(createElement(TestConsumer));

  expect(hookRef.current).not.toBeNull();
  if (hookRef.current) {
   hookRef.current.speak("你好");
   expect(mockSpeakSequence).toHaveBeenCalledWith(["你好"], undefined);

   hookRef.current.stop();
   expect(mockStop).toHaveBeenCalled();
  }
 });
});
