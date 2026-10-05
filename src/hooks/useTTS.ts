"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { buildCacheKey, getCachedAudio, setCachedAudio } from "@/lib/audio/tts-cache";
import {
 isOfflineSpeechSupported,
 speakChineseOffline,
} from "@/features/hanzihome/speech/offline-speech-fallback";
import type { JsonFieldValue } from "@/types/json";

export const TTSVoiceSchema = z.object({
 name: z.string(),
 shortName: z.string(),
 gender: z.string(),
 locale: z.string(),
});
const TTSVoiceListSchema = z.array(TTSVoiceSchema);
export type TTSVoice = z.infer<typeof TTSVoiceSchema>;

const DEFAULT_RATE = 1;
const MAX_TTS_TEXT_LENGTH = 10_000;
const TTS_AUTH_ERROR_MESSAGE = "Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại để dùng giọng đọc.";
export const DEFAULT_MANDARIN_VOICE = "zh-CN-XiaoxiaoNeural";

const ttsPlaybackResultSchema = z.strictObject({ completed: z.boolean(), cancelled: z.boolean() });
type TTSPlaybackOptions = {
 onProgress?: (progress: number) => void;
 onSettled?: () => void;
 rate: number;
};
type TTSPlaybackLifecycle = TTSPlaybackOptions & {
 resolve: (result: z.output<typeof ttsPlaybackResultSchema>) => void;
 reject: (error: Error) => void;
};
type TTSPreparedAudio = {
 key: string;
 controller: AbortController;
 promise: Promise<Blob>;
};

function splitSpeechSegments(segments: readonly string[]) {
 const normalizedText = segments
  .map((segment) => segment.trim())
  .filter(Boolean)
  .join("\n");
 if (!normalizedText) return [];
 if (normalizedText.length <= MAX_TTS_TEXT_LENGTH) return [normalizedText];

 const chunks: string[] = [];
 let chunk = "";
 for (const character of Array.from(normalizedText)) {
  if (chunk && chunk.length + character.length > MAX_TTS_TEXT_LENGTH) {
   chunks.push(chunk);
   chunk = "";
  }
  chunk += character;
 }
 if (chunk) chunks.push(chunk);
 return chunks;
}

type TTSState = z.infer<
 z.ZodObject<{
  isSpeaking: z.ZodBoolean;
  isPaused: z.ZodBoolean;
  isLoading: z.ZodBoolean;
  error: z.ZodNullable<z.ZodString>;
 }>
>;

export function useTTS() {
 const [state, setState] = useState<TTSState>({
  isSpeaking: false,
  isPaused: false,
  isLoading: false,
  error: null,
 });
 const [progress, setProgress] = useState(0);
 const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
 const [durationSeconds, setDurationSeconds] = useState(0);
 const [voices, setVoices] = useState<TTSVoice[]>([]);
 const [selectedVoiceName, setSelectedVoiceName] = useState("");
 const [rate, setRate] = useState(DEFAULT_RATE);
 const [speakingText, setSpeakingText] = useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [speakingRequestText, setSpeakingRequestText] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const audioRef = useRef<HTMLAudioElement>(null);
 const objectUrlRef = useRef<string>(null);
 const abortControllerRef = useRef<AbortController>(null);
 const generationAbortControllerRef = useRef<AbortController>(null);
 const voiceLoadControllerRef = useRef<AbortController>(null);
 const voiceLoadPromiseRef = useRef<Promise<TTSVoice[]> | null>(null);
 const voiceLoadErrorRef = useRef<Error>(null);
 const playbackRunRef = useRef(0);
 const sequenceSegmentsRef = useRef<string[]>([]);
 const sequenceIndexRef = useRef(0);
 const settledCallbackRef = useRef<() => void>(null);
 const lifecycleRef = useRef<TTSPlaybackLifecycle>(null);
 const synthesisRateRef = useRef(DEFAULT_RATE);
 const preparedAudioRef = useRef<TTSPreparedAudio>(null);
 const preparationRunRef = useRef(0);

 const cancelPreparation = useCallback(() => {
  preparationRunRef.current += 1;
  preparedAudioRef.current?.controller.abort();
  preparedAudioRef.current = null;
 }, []);

 const cleanupAudio = useCallback(() => {
  if (audioRef.current) {
   const audio = audioRef.current;
   audio.onended = null;
   audio.onerror = null;
   audio.onpause = null;
   audio.onplay = null;
   audio.onloadedmetadata = null;
   audio.ontimeupdate = null;
   audio.pause();
   audio.removeAttribute("src");
   audio.load();
   audioRef.current = null;
  }
  if (objectUrlRef.current) {
   URL.revokeObjectURL(objectUrlRef.current);
   objectUrlRef.current = null;
  }
 }, []);

 const settleLifecycle = useCallback((completed: boolean, error?: Error) => {
  const lifecycle = lifecycleRef.current;
  lifecycleRef.current = null;
  lifecycle?.onSettled?.();
  if (error) lifecycle?.reject(error);
  else lifecycle?.resolve({ completed, cancelled: !completed });
 }, []);

 const settlePlayback = useCallback(
  (completed = true, error?: Error) => {
   const callback = settledCallbackRef.current;
   settledCallbackRef.current = null;
   settleLifecycle(completed, error);
   callback?.();
  },
  [settleLifecycle],
 );

 const stop = useCallback(() => {
  cancelPreparation();
  playbackRunRef.current += 1;
  abortControllerRef.current?.abort();
  generationAbortControllerRef.current?.abort();
  abortControllerRef.current = null;
  generationAbortControllerRef.current = null;
  cleanupAudio();
  setSpeakingText(null);
  setSpeakingRequestText(null);
  setProgress(0);
  setCurrentTimeSeconds(0);
  setDurationSeconds(0);
  sequenceSegmentsRef.current = [];
  sequenceIndexRef.current = 0;
  setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
  settlePlayback(false);
 }, [cancelPreparation, cleanupAudio, settlePlayback]);

 const pause = useCallback(() => {
  const audio = audioRef.current;
  if (audio === null || audio.paused) return;
  audio.pause();
 }, []);

 const resume = useCallback(() => {
  const audio = audioRef.current;
  if (audio === null || !audio.paused) return;
  const runId = playbackRunRef.current;
  void audio.play().catch(() => {
   if (playbackRunRef.current !== runId) return;
   setState((current) => ({
    ...current,
    isSpeaking: false,
    isPaused: true,
    error: "Trình duyệt đã chặn tiếp tục phát audio.",
   }));
   settleLifecycle(false, new Error("Trình duyệt đã chặn tiếp tục phát audio."));
  });
 }, [settleLifecycle]);

 const loadVoices = useCallback((): Promise<TTSVoice[]> => {
  if (voices.length > 0) return Promise.resolve(voices);
  const pending = voiceLoadPromiseRef.current;
  if (pending !== null) return pending;

  const controller = new AbortController();
  voiceLoadControllerRef.current = controller;
  voiceLoadErrorRef.current = null;
  const promise = (async () => {
   try {
    const response = await fetch("/api/tts", { signal: controller.signal });
    if (response.status === 401) throw new Error(TTS_AUTH_ERROR_MESSAGE);
    if (!response.ok) throw new Error(`TTS voices API ${response.status}`);

    const voicePayload: JsonFieldValue = await response.json();
    const nextVoices = TTSVoiceListSchema.parse(voicePayload);
    setVoices(nextVoices);
    setSelectedVoiceName((current) =>
     nextVoices.some((voice) => voice.shortName === current)
      ? current
      : (nextVoices[0]?.shortName ?? ""),
    );
    setState((current) => ({ ...current, error: null }));
    return nextVoices;
   } catch (error) {
    if (controller.signal.aborted) return [];
    const failure =
     error instanceof Error ? error : new Error("Không tải được giọng Mandarin zh-CN");
    voiceLoadErrorRef.current = failure;
    setState((current) => ({
     ...current,
     error: failure.message,
    }));
    return [];
   }
  })();
  voiceLoadPromiseRef.current = promise;
  void promise.then(
   () => {
    if (voiceLoadPromiseRef.current === promise) voiceLoadPromiseRef.current = null;
   },
   () => {
    if (voiceLoadPromiseRef.current === promise) voiceLoadPromiseRef.current = null;
   },
  );
  return promise;
 }, [voices]);

 useEffect(() => {
  return () => {
   voiceLoadControllerRef.current?.abort();
   playbackRunRef.current += 1;
   abortControllerRef.current?.abort();
   generationAbortControllerRef.current?.abort();
   cancelPreparation();
   cleanupAudio();
   settleLifecycle(false);
  };
 }, [cancelPreparation, cleanupAudio, settleLifecycle]);

 const playBlob = useCallback(
  (blob: Blob, runId: number, text: string, onComplete?: () => void, synthesisRate = rate) => {
   if (playbackRunRef.current !== runId) return;

   const url = URL.createObjectURL(blob);
   objectUrlRef.current = url;
   const audio = new Audio(url);
   audioRef.current = audio;
   synthesisRateRef.current = synthesisRate;
   audio.playbackRate = (lifecycleRef.current?.rate ?? synthesisRate) / synthesisRate;
   const finish = () => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    if (onComplete) {
     setProgress(1);
     onComplete();
     return;
    }
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(1);
    setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
    settlePlayback();
   };
   audio.onended = finish;
   audio.onerror = () => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(0);
    setCurrentTimeSeconds(0);
    setDurationSeconds(0);
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
     isPaused: false,
     isLoading: false,
     error: "Không thể phát audio từ Microsoft Edge Read Aloud.",
    });
    settlePlayback(false, new Error("Không thể phát audio từ Microsoft Edge Read Aloud."));
   };
   const syncTiming = () => {
    if (playbackRunRef.current !== runId) return;
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const currentTime = Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0;
    setCurrentTimeSeconds(currentTime);
    setDurationSeconds(duration);
    if (duration > 0) {
     const nextProgress = Math.min(1, Math.max(0, currentTime / duration));
     setProgress(nextProgress);
     lifecycleRef.current?.onProgress?.(nextProgress);
    }
   };
   audio.onloadedmetadata = syncTiming;
   audio.ontimeupdate = syncTiming;
   setSpeakingText(text);
   setProgress(0);
   audio.onplay = () => {
    if (playbackRunRef.current !== runId) return;
    setState((current) => ({ ...current, isSpeaking: true, isPaused: false, error: null }));
    lifecycleRef.current?.onProgress?.(
     audio.duration > 0 ? Math.min(1, Math.max(0, audio.currentTime / audio.duration)) : 0,
    );
   };
   audio.onpause = () => {
    if (playbackRunRef.current !== runId || audio.ended) return;
    setState((current) => ({ ...current, isSpeaking: false, isPaused: true }));
   };
   setState({ isSpeaking: true, isPaused: false, isLoading: false, error: null });
   void audio.play().catch(() => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(0);
    setCurrentTimeSeconds(0);
    setDurationSeconds(0);
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
     isPaused: false,
     isLoading: false,
     error: "Trình duyệt đã chặn phát audio. Hãy chạm lại nút đọc.",
    });
    settlePlayback(false, new Error("Trình duyệt đã chặn phát audio. Hãy chạm lại nút đọc."));
   });
  },
  [cleanupAudio, rate, settlePlayback],
 );

 const loadAudio = useCallback(
  async (
   text: string,
   voiceName: string,
   synthesisRate: number,
   controller: AbortController,
  ): Promise<Blob> => {
   const cacheKey = buildCacheKey(text, voiceName, synthesisRate);
   const cached = await getCachedAudio(cacheKey);
   if (controller.signal.aborted) throw new Error("TTS preparation cancelled");
   if (cached) return cached;
   const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: voiceName, rate: synthesisRate }),
    signal: controller.signal,
   });
   if (response.status === 401) throw new Error(TTS_AUTH_ERROR_MESSAGE);
   if (!response.ok) throw new Error(`TTS API ${response.status}`);
   const blob = await response.blob();
   if (controller.signal.aborted) throw new Error("TTS preparation cancelled");
   void setCachedAudio(cacheKey, blob);
   return blob;
  },
  [],
 );

 const prepareAudio = useCallback(
  async (text: string, synthesisRate: number): Promise<void> => {
   const normalizedText = splitSpeechSegments([text])[0];
   if (!normalizedText) return;
   const runId = preparationRunRef.current;
   const availableVoices = await loadVoices();
   if (runId !== preparationRunRef.current) return;
   const voiceName = selectedVoiceName || availableVoices[0]?.shortName;
   if (!voiceName)
    throw voiceLoadErrorRef.current ?? new Error("Không tải được giọng Mandarin zh-CN");
   const key = buildCacheKey(normalizedText, voiceName, synthesisRate);
   let preparation = preparedAudioRef.current;
   if (preparation?.key !== key) {
    preparation?.controller.abort();
    const controller = new AbortController();
    preparation = {
     key,
     controller,
     promise: loadAudio(normalizedText, voiceName, synthesisRate, controller),
    };
    preparedAudioRef.current = preparation;
   }
   await preparation.promise;
  },
  [loadAudio, loadVoices, selectedVoiceName],
 );

 const loadAndPlay = useCallback(
  async (
   text: string,
   runId: number,
   onComplete?: () => void,
   voiceName = selectedVoiceName,
   synthesisRate = rate,
  ) => {
   const cacheKey = buildCacheKey(text, voiceName, synthesisRate);
   const preparation = preparedAudioRef.current;
   preparedAudioRef.current = null;
   const matches = preparation?.key === cacheKey;
   if (!matches) preparation?.controller.abort();
   const controller = matches && preparation ? preparation.controller : new AbortController();
   abortControllerRef.current = controller;

   try {
    const blob =
     matches && preparation
      ? await preparation.promise.catch((error) => {
         if (controller.signal.aborted) throw error;
         return loadAudio(text, voiceName, synthesisRate, controller);
        })
      : await loadAudio(text, voiceName, synthesisRate, controller);
    if (playbackRunRef.current !== runId) return;
    playBlob(blob, runId, text, onComplete, synthesisRate);
   } catch (error) {
    if (controller.signal.aborted || playbackRunRef.current !== runId) return;

    if (
     isOfflineSpeechSupported() &&
     !(error instanceof Error && error.message === TTS_AUTH_ERROR_MESSAGE)
    ) {
     try {
      setState((prev) => ({ ...prev, isLoading: false, isSpeaking: true, error: null }));
      setSpeakingText(text);
      const speechResult = await speakChineseOffline(text, {
       rate: synthesisRate,
       onEnd: () => {
        if (playbackRunRef.current !== runId) return;
        setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
        setSpeakingText(null);
        setSpeakingRequestText(null);
        onComplete?.();
        settlePlayback(true);
       },
       onError: (speechError) => {
        if (playbackRunRef.current !== runId) return;
        setState({
         isSpeaking: false,
         isPaused: false,
         isLoading: false,
         error: speechError.message,
        });
        settlePlayback(false, speechError);
       },
      });
      if (speechResult.completed || speechResult.cancelled) return;
     } catch {
      // Fall through to standard error handling
     }
    }

    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(0);
    setCurrentTimeSeconds(0);
    setDurationSeconds(0);
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
     isPaused: false,
     isLoading: false,
     error: error instanceof Error ? error.message : "Microsoft Edge Read Aloud không khả dụng.",
    });
    settlePlayback(
     false,
     error instanceof Error ? error : new Error("Microsoft Edge Read Aloud không khả dụng."),
    );
   } finally {
    if (abortControllerRef.current === controller) abortControllerRef.current = null;
   }
  },
  [loadAudio, playBlob, rate, selectedVoiceName, settlePlayback],
 );

 const speak = useCallback(
  async (text: string) => {
   const normalizedText = text.trim();
   if (!normalizedText) {
    setState((current) => ({
     ...current,
     error: null,
    }));
    return;
   }

   playbackRunRef.current += 1;
   cancelPreparation();
   const runId = playbackRunRef.current;
   settleLifecycle(false);
   abortControllerRef.current?.abort();
   cleanupAudio();

   const availableVoices = await loadVoices();
   if (playbackRunRef.current !== runId) return;
   const voiceName = selectedVoiceName || availableVoices[0]?.shortName || DEFAULT_MANDARIN_VOICE;

   sequenceSegmentsRef.current = [];
   sequenceIndexRef.current = 0;
   setSpeakingText(null);
   setSpeakingRequestText(normalizedText);
   setProgress(0);
   setCurrentTimeSeconds(0);
   setDurationSeconds(0);
   setState({ isSpeaking: false, isPaused: false, isLoading: true, error: null });

   await loadAndPlay(
    normalizedText,
    runId,
    () => {
     setSpeakingText(null);
     setSpeakingRequestText(null);
     setProgress(1);
     setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
     settlePlayback();
    },
    voiceName,
   );
  },
  [
   cancelPreparation,
   cleanupAudio,
   loadAndPlay,
   loadVoices,
   selectedVoiceName,
   settleLifecycle,
   settlePlayback,
  ],
 );

 const setPlaybackRate = useCallback(
  (nextRate: number) => {
   if (!Number.isFinite(nextRate) || nextRate <= 0) return;
   if (lifecycleRef.current?.rate !== nextRate) cancelPreparation();
   setRate(nextRate);
   if (lifecycleRef.current) lifecycleRef.current.rate = nextRate;
   if (audioRef.current) audioRef.current.playbackRate = nextRate / synthesisRateRef.current;
  },
  [cancelPreparation],
 );

 const generateAudio = useCallback(
  async (text: string): Promise<Blob | null> => {
   const normalizedText = text.trim();
   if (!normalizedText) {
    setState((current) => ({
     ...current,
     error: null,
    }));
    return null;
   }

   const availableVoices = await loadVoices();
   const voiceName = selectedVoiceName || availableVoices[0]?.shortName || DEFAULT_MANDARIN_VOICE;

   const cacheKey = buildCacheKey(normalizedText, voiceName, rate);
   const cached = await getCachedAudio(cacheKey);
   if (cached) return cached;

   generationAbortControllerRef.current?.abort();
   const controller = new AbortController();
   generationAbortControllerRef.current = controller;

   try {
    const response = await fetch("/api/tts", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      text: normalizedText,
      voice: voiceName,
      rate,
     }),
     signal: controller.signal,
    });
    if (response.status === 401) throw new Error(TTS_AUTH_ERROR_MESSAGE);
    if (!response.ok) throw new Error(`TTS API ${response.status}`);

    const blob = await response.blob();
    if (controller.signal.aborted) return null;
    await setCachedAudio(cacheKey, blob);
    setState((current) => ({ ...current, error: null }));
    return blob;
   } catch (error) {
    if (controller.signal.aborted) return null;
    setState((current) => ({
     ...current,
     error: error instanceof Error ? error.message : "Không tạo được audio Mandarin.",
    }));
    return null;
   } finally {
    if (generationAbortControllerRef.current === controller) {
     generationAbortControllerRef.current = null;
    }
   }
  },
  [loadVoices, rate, selectedVoiceName],
 );

 const finishSequence = useCallback(
  (runId: number) => {
   if (playbackRunRef.current !== runId) return;
   sequenceSegmentsRef.current = [];
   sequenceIndexRef.current = 0;
   setSpeakingText(null);
   setSpeakingRequestText(null);
   setProgress(1);
   setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
   settlePlayback();
  },
  [settlePlayback],
 );

 const playNextSequenceSegment = useCallback(
  async (runId: number, voiceName: string) => {
   if (playbackRunRef.current !== runId) return;

   const nextSegment = sequenceSegmentsRef.current[sequenceIndexRef.current];
   if (!nextSegment) {
    finishSequence(runId);
    return;
   }

   setState({ isSpeaking: false, isPaused: false, isLoading: true, error: null });
   await loadAndPlay(
    nextSegment,
    runId,
    () => {
     sequenceIndexRef.current += 1;
     void playNextSequenceSegment(runId, voiceName);
    },
    voiceName,
    lifecycleRef.current?.rate ?? rate,
   );
  },
  [finishSequence, loadAndPlay, rate],
 );

 const speakWithLifecycle = useCallback(
  (
   text: string,
   options: TTSPlaybackOptions,
  ): Promise<z.output<typeof ttsPlaybackResultSchema>> => {
   // Keep the one prepared segment across the normal Reader handoff.
   const preparation = preparedAudioRef.current;
   preparedAudioRef.current = null;
   stop();
   const runId = playbackRunRef.current;
   const normalizedText = text.trim();
   if (!normalizedText) {
    preparation?.controller.abort();
    return Promise.resolve({ completed: true, cancelled: false });
   }
   if (!Number.isFinite(options.rate) || options.rate <= 0) {
    preparation?.controller.abort();
    return Promise.reject(new Error("Invalid speech rate"));
   }
   preparedAudioRef.current = preparation;
   return new Promise((resolve, reject) => {
    sequenceSegmentsRef.current = splitSpeechSegments([normalizedText]);
    sequenceIndexRef.current = 0;
    lifecycleRef.current = {
     ...options,
     resolve,
     reject,
     onProgress: (progress) => {
      const index = sequenceIndexRef.current;
      const preceding = sequenceSegmentsRef.current
       .slice(0, index)
       .reduce((sum, part) => sum + part.length, 0);
      const length = sequenceSegmentsRef.current[index]?.length ?? 0;
      options.onProgress?.(
       preceding / normalizedText.length + (length / normalizedText.length) * progress,
      );
     },
    };
    setSpeakingRequestText(normalizedText);
    setState({ isSpeaking: false, isPaused: false, isLoading: true, error: null });
    void loadVoices()
     .then(async (availableVoices) => {
      if (playbackRunRef.current !== runId) return;
      const voiceName = selectedVoiceName || availableVoices[0]?.shortName;
      if (!voiceName) {
       throw voiceLoadErrorRef.current ?? new Error("Không tải được giọng Mandarin zh-CN");
      }
      await playNextSequenceSegment(runId, voiceName);
     })
     .catch((error) => {
      if (playbackRunRef.current !== runId) return;
      const failure =
       error instanceof Error ? error : new Error("Microsoft Edge Read Aloud không khả dụng.");
      settlePlayback(false, failure);
      setSpeakingRequestText(null);
      setState({ isSpeaking: false, isPaused: false, isLoading: false, error: failure.message });
     });
   });
  },
  [loadVoices, playNextSequenceSegment, selectedVoiceName, settlePlayback, stop],
 );

 const speakSequence = useCallback(
  (segments: readonly string[], onComplete?: () => void) => {
   const requestedText = segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("\n");
   const normalizedSegments = splitSpeechSegments(segments);
   if (normalizedSegments.length === 0) {
    stop();
    return;
   }

   playbackRunRef.current += 1;
   cancelPreparation();
   const runId = playbackRunRef.current;
   settleLifecycle(false);
   abortControllerRef.current?.abort();
   cleanupAudio();

   void loadVoices().then((availableVoices) => {
    if (playbackRunRef.current !== runId) return;
    const voiceName = selectedVoiceName || availableVoices[0]?.shortName || DEFAULT_MANDARIN_VOICE;

    sequenceSegmentsRef.current = normalizedSegments;
    sequenceIndexRef.current = 0;
    settledCallbackRef.current = onComplete ?? null;
    setSpeakingText(null);
    setSpeakingRequestText(requestedText);
    setProgress(0);
    setCurrentTimeSeconds(0);
    setDurationSeconds(0);
    setState({ isSpeaking: false, isPaused: false, isLoading: true, error: null });
    void playNextSequenceSegment(runId, voiceName);
   });
  },
  [
   cancelPreparation,
   cleanupAudio,
   loadVoices,
   playNextSequenceSegment,
   selectedVoiceName,
   settleLifecycle,
   stop,
  ],
 );

 const selectedVoice =
  voices.find((voice) => voice.shortName === selectedVoiceName) ?? voices[0] ?? null;

 return {
  voices,
  loadVoices,
  selectedVoice,
  selectedVoiceName,
  setSelectedVoiceName,
  rate,
  setRate,
  speak,
  speakWithLifecycle,
  setPlaybackRate,
  speakSequence,
  pause,
  resume,
  generateAudio,
  prepareAudio,
  cancelPreparation,
  stop,
  isSpeaking: state.isSpeaking,
  isPaused: state.isPaused,
  speakingText,
  speakingRequestText,
  progress,
  currentTimeSeconds,
  durationSeconds,
  isLoading: state.isLoading,
  error: state.error,
 };
}
