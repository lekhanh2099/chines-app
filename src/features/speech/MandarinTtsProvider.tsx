"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useTTS } from "@/hooks/useTTS";
import type { ReaderSpeechService } from "@/features/reader/runtime/reader-speech";

type MandarinTtsContextValue = ReturnType<typeof useTTS>;

type MandarinTtsContextState = { value?: MandarinTtsContextValue };
const MandarinTtsContext = createContext<MandarinTtsContextState>({});
type MandarinTtsControls = {
 isSpeaking: MandarinTtsContextValue["isSpeaking"];
 isLoading: MandarinTtsContextValue["isLoading"];
 speakingRequestText: MandarinTtsContextValue["speakingRequestText"];
 speakSequence: MandarinTtsContextValue["speakSequence"];
 stop: MandarinTtsContextValue["stop"];
};
const MandarinTtsControlsContext = createContext<{ value?: MandarinTtsControls }>({});
const MandarinReaderSpeechContext = createContext<ReaderSpeechService | null>(null);

export function createMandarinReaderSpeechService(initialController: MandarinTtsContextValue) {
 let controller = initialController;
 let run = 0;
 let pending = false;
 const speech: ReaderSpeechService = {
  prepare: async (input) => {
   if (pending) await controller.prepareAudio(input.text.slice(input.startOffset), input.rate);
  },
  speak: async (input) => {
   const token = ++run;
   pending = true;
   try {
    return await controller.speakWithLifecycle(input.text.slice(input.startOffset), {
     rate: input.rate,
     onSettled: () => {
      if (token === run) pending = false;
     },
     onProgress: (progress) => {
      if (token === run) input.onProgress?.({ progress });
     },
    });
   } finally {
    if (token === run) pending = false;
   }
  },
  stop: () => {
   run += 1;
   controller.cancelPreparation();
   if (!pending) return;
   pending = false;
   controller.stop();
  },
  pause: () => {
   if (pending) controller.pause();
  },
  resume: () => {
   if (pending) controller.resume();
  },
  setRate: (rate) => {
   if (pending) controller.setPlaybackRate(rate);
  },
 };
 return {
  speech,
  updateController: (next: MandarinTtsContextValue) => {
   controller = next;
  },
 };
}

export function MandarinTtsProvider({ children }: { children: ReactNode }) {
 const tts = useTTS();
 const controlsContext = useMemo(
  () => ({
   value: {
    isSpeaking: tts.isSpeaking,
    isLoading: tts.isLoading,
    speakingRequestText: tts.speakingRequestText,
    speakSequence: tts.speakSequence,
    stop: tts.stop,
   },
  }),
  [tts.isSpeaking, tts.isLoading, tts.speakingRequestText, tts.speakSequence, tts.stop],
 );
 const [adapter] = useState(() => createMandarinReaderSpeechService(tts));
 useEffect(() => {
  adapter.updateController(tts);
 }, [adapter, tts]);

 return (
  <MandarinTtsContext.Provider value={{ value: tts }}>
   <MandarinTtsControlsContext.Provider value={controlsContext}>
    <MandarinReaderSpeechContext.Provider value={adapter.speech}>
     {children}
    </MandarinReaderSpeechContext.Provider>
   </MandarinTtsControlsContext.Provider>
  </MandarinTtsContext.Provider>
 );
}

export function useMandarinReaderSpeechService(): ReaderSpeechService {
 const speech = useContext(MandarinReaderSpeechContext);
 if (!speech) throw new Error("useMandarinReaderSpeechService requires MandarinTtsProvider");
 return speech;
}

export function useSharedMandarinTts(): MandarinTtsContextValue {
 const context = useContext(MandarinTtsContext);
 if (!context.value) throw new Error("useSharedMandarinTts requires MandarinTtsProvider");
 return context.value;
}

export function useMandarinTtsControls(): MandarinTtsControls {
 const context = useContext(MandarinTtsControlsContext);
 if (!context.value) throw new Error("useMandarinTtsControls requires MandarinTtsProvider");
 return context.value;
}
