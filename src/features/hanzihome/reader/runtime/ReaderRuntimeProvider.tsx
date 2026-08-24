"use client";

import { useSelector } from "@tanstack/react-store";
import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useRef,
 useState,
 type ReactNode,
} from "react";

import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import type { ReaderDocumentModel } from "../model/reader-document.types";
import {
 createReaderRuntimeStore,
 type ReaderRuntimeState,
 type ReaderRuntimeStore,
} from "./reader-runtime-store";

export type ReaderRuntimeCommands = {
 playCurrent: () => void;
 playAll: () => void;
 playFromCharacter: (index: number, startOffset: number) => void;
 pause: () => void;
 resume: () => void;
 stop: () => void;
 restartCurrent: () => void;
 previous: () => void;
 next: () => void;
 selectIndex: (index: number) => void;
 setRate: (rate: number) => void;
};

type ReaderRuntimeContextValue = {
 store: ReaderRuntimeStore;
 commands: ReaderRuntimeCommands;
};

type ReaderSequencePlaybackItem = {
 segmentId: string;
 segmentIndex: number;
 sourceStartOffset: number;
 textStart: number;
 textEnd: number;
};

const ReaderRuntimeContext = createContext<ReaderRuntimeContextValue | null>(null);
const noop = () => undefined;
const noRuntimeCommands: ReaderRuntimeCommands = {
 playCurrent: noop,
 playAll: noop,
 playFromCharacter: noop,
 pause: noop,
 resume: noop,
 stop: noop,
 restartCurrent: noop,
 previous: noop,
 next: noop,
 selectIndex: noop,
 setRate: noop,
};

export function ReaderRuntimeProvider({
 document,
 children,
 onPlaybackComplete,
}: {
 document: ReaderDocumentModel;
 children: ReactNode;
 onPlaybackComplete?: () => void;
}) {
 const [store] = useState(() =>
  createReaderRuntimeStore(document.segments.map((segment) => segment.id)),
 );
 const commandsRef = useRef<ReaderRuntimeCommands>(noRuntimeCommands);
 const commands = useMemo<ReaderRuntimeCommands>(
  () => ({
   playCurrent: () => commandsRef.current.playCurrent(),
   playAll: () => commandsRef.current.playAll(),
   playFromCharacter: (index, startOffset) =>
    commandsRef.current.playFromCharacter(index, startOffset),
   pause: () => commandsRef.current.pause(),
   resume: () => commandsRef.current.resume(),
   stop: () => commandsRef.current.stop(),
   restartCurrent: () => commandsRef.current.restartCurrent(),
   previous: () => commandsRef.current.previous(),
   next: () => commandsRef.current.next(),
   selectIndex: (index) => commandsRef.current.selectIndex(index),
   setRate: (rate) => commandsRef.current.setRate(rate),
  }),
  [],
 );

 useEffect(() => {
  store.actions.replaceSegments(document.segments.map((segment) => segment.id));
 }, [document.segments, store]);
 const context = useMemo(() => ({ store, commands }), [commands, store]);

 return (
  <ReaderRuntimeContext.Provider value={context}>
   <ReaderTtsBridge
    document={document}
    store={store}
    commandsRef={commandsRef}
    onPlaybackComplete={onPlaybackComplete}
   />
   {children}
  </ReaderRuntimeContext.Provider>
 );
}

function ReaderTtsBridge({
 document,
 store,
 commandsRef,
 onPlaybackComplete,
}: {
 document: ReaderDocumentModel;
 store: ReaderRuntimeStore;
 commandsRef: { current: ReaderRuntimeCommands };
 onPlaybackComplete?: () => void;
}) {
 const tts = useSharedMandarinTts();
 const {
  error,
  isLoading,
  isPaused,
  isSpeaking,
  pause: pauseTts,
  progress,
  rate,
  resume: resumeTts,
  setRate: setTtsRate,
  speakingRequestText,
  speakingText,
  speakSequence,
  stop: stopTts,
 } = tts;
 const runRef = useRef(0);
 const ownsPlaybackRef = useRef(false);
 const continuousRef = useRef(false);
 const allowAutoAdvanceRef = useRef(true);
 const playbackPlanRef = useRef<ReaderSequencePlaybackItem[]>([]);
 const finishPlayback = useCallback(
  (completed = false) => {
   ownsPlaybackRef.current = false;
   continuousRef.current = false;
   allowAutoAdvanceRef.current = true;
   playbackPlanRef.current = [];
   store.actions.resetPlayback();
   if (completed) onPlaybackComplete?.();
  },
  [onPlaybackComplete, store],
 );
 const playAtRef =
  useRef<
   (
    index: number,
    runId: number,
    continuous: boolean,
    allowAutoAdvance: boolean,
    startOffset: number,
   ) => void
  >(noop);
 const playAt = useCallback(
  (
   index: number,
   runId: number,
   continuous: boolean,
   allowAutoAdvance: boolean,
   startOffset = 0,
  ) => {
   if (runRef.current !== runId) return;
   const segment = document.segments[index];
   if (!segment) {
    finishPlayback(true);
    return;
   }
   const boundedOffset = Math.min(Math.max(Math.trunc(startOffset), 0), segment.zh.length);
   const playWholeDocument =
    !store.state.loopCurrent && (continuous || (allowAutoAdvance && store.state.autoAdvance));
   const speechItems = (playWholeDocument ? document.segments.slice(index) : [segment]).flatMap(
    (item, itemIndex) => {
     const text =
      itemIndex === 0 && boundedOffset > 0
       ? item.zh.slice(boundedOffset).trim()
       : (item.speechText ?? item.zh).trim();
     return text
      ? [
         {
          segmentId: item.id,
          segmentIndex: index + itemIndex,
          sourceStartOffset: itemIndex === 0 ? boundedOffset : 0,
          text,
         },
        ]
      : [];
    },
   );
   if (speechItems.length === 0) {
    finishPlayback(playWholeDocument || index >= document.segments.length - 1);
    return;
   }

   let textOffset = 0;
   playbackPlanRef.current = speechItems.map((item, itemIndex) => {
    const textStart = textOffset;
    const textEnd = textStart + item.text.length;
    textOffset = textEnd + (itemIndex < speechItems.length - 1 ? 1 : 0);
    return {
     segmentId: item.segmentId,
     segmentIndex: item.segmentIndex,
     sourceStartOffset: item.sourceStartOffset,
     textStart,
     textEnd,
    };
   });

   ownsPlaybackRef.current = true;
   continuousRef.current = continuous;
   allowAutoAdvanceRef.current = allowAutoAdvance;
   store.actions.selectIndex(index, "playback");
   store.actions.syncPlayback({
    playbackSegmentId: segment.id,
    playbackStatus: "loading",
    playbackStartOffset: boundedOffset,
    progress: 0,
    rate,
    error: null,
   });
   speakSequence(
    speechItems.map((item) => item.text),
    () => {
     if (runRef.current !== runId) return;
     if (store.state.loopCurrent) {
      playAtRef.current(index, runId, continuous, allowAutoAdvance, boundedOffset);
      return;
     }
     if (playWholeDocument) {
      finishPlayback(true);
      return;
     }
     const nextIndex = index + 1;
     if (
      (continuous || (allowAutoAdvance && store.state.autoAdvance)) &&
      nextIndex < document.segments.length
     ) {
      playAtRef.current(nextIndex, runId, continuous, allowAutoAdvance, 0);
      return;
     }
     finishPlayback(index >= document.segments.length - 1);
    },
   );
  },
  [document.segments, finishPlayback, rate, speakSequence, store],
 );
 useEffect(() => {
  playAtRef.current = playAt;
 }, [playAt]);

 const startAt = useCallback(
  (index: number, continuous: boolean, allowAutoAdvance = true, startOffset = 0) => {
   if (document.segments.length === 0) return;
   runRef.current += 1;
   const runId = runRef.current;
   if (ownsPlaybackRef.current) stopTts();
   ownsPlaybackRef.current = true;
   continuousRef.current = continuous;
   allowAutoAdvanceRef.current = allowAutoAdvance;
   playAt(
    Math.min(Math.max(index, 0), document.segments.length - 1),
    runId,
    continuous,
    allowAutoAdvance,
    startOffset,
   );
  },
  [document.segments.length, playAt, stopTts],
 );
 const stop = useCallback(() => {
  runRef.current += 1;
  if (ownsPlaybackRef.current) stopTts();
  finishPlayback(false);
 }, [finishPlayback, stopTts]);
 const selectIndex = useCallback(
  (index: number) => {
   const nextIndex = Math.min(Math.max(index, 0), Math.max(0, document.segments.length - 1));
   if (ownsPlaybackRef.current && store.state.playbackStatus !== "idle") {
    runRef.current += 1;
    const runId = runRef.current;
    stopTts();
    ownsPlaybackRef.current = true;
    playAt(nextIndex, runId, continuousRef.current, allowAutoAdvanceRef.current, 0);
    return;
   }
   store.actions.selectIndex(nextIndex, "command");
  },
  [document.segments.length, playAt, stopTts, store],
 );
 const previous = useCallback(() => selectIndex(store.state.activeIndex - 1), [selectIndex, store]);
 const next = useCallback(() => selectIndex(store.state.activeIndex + 1), [selectIndex, store]);

 useEffect(() => {
  commandsRef.current = {
   playCurrent: () => startAt(store.state.activeIndex, true, true, 0),
   playAll: () => startAt(0, true, true, 0),
   playFromCharacter: (index, startOffset) => startAt(index, false, false, startOffset),
   pause: () => {
    if (ownsPlaybackRef.current) pauseTts();
   },
   resume: () => {
    if (ownsPlaybackRef.current) resumeTts();
   },
   stop,
   restartCurrent: () =>
    startAt(
     store.state.activeIndex,
     continuousRef.current,
     allowAutoAdvanceRef.current,
     store.state.playbackStartOffset,
    ),
   previous,
   next,
   selectIndex,
   setRate: (nextRate) => {
    setTtsRate(nextRate);
    store.actions.syncPlayback({
     playbackSegmentId: store.state.playbackSegmentId,
     playbackStatus: store.state.playbackStatus,
     progress: store.state.progress,
     rate: nextRate,
     error: store.state.error,
    });
   },
  };
 }, [
  commandsRef,
  next,
  pauseTts,
  previous,
  resumeTts,
  selectIndex,
  setTtsRate,
  startAt,
  stop,
  store,
 ]);

 useEffect(() => {
  if (!ownsPlaybackRef.current) return;
  const chunkStart =
   speakingRequestText && speakingText ? Math.max(0, speakingRequestText.indexOf(speakingText)) : 0;
  const absoluteProgress = chunkStart + (speakingText ? speakingText.length * progress : 0);
  const playbackItem =
   playbackPlanRef.current.find((item) => absoluteProgress <= item.textEnd) ??
   playbackPlanRef.current.at(-1) ??
   null;
  if (!playbackItem) return;
  const localProgress = Math.min(
   1,
   Math.max(
    0,
    (absoluteProgress - playbackItem.textStart) / (playbackItem.textEnd - playbackItem.textStart),
   ),
  );
  store.actions.selectIndex(playbackItem.segmentIndex, "playback");
  store.actions.syncPlayback({
   playbackSegmentId: playbackItem.segmentId,
   playbackStatus: isLoading ? "loading" : isPaused ? "paused" : isSpeaking ? "playing" : "idle",
   playbackStartOffset: playbackItem.sourceStartOffset,
   progress: localProgress,
   rate,
   error,
  });
 }, [
  error,
  isLoading,
  isPaused,
  isSpeaking,
  progress,
  rate,
  speakingRequestText,
  speakingText,
  store,
 ]);
 useEffect(
  () => () => {
   runRef.current += 1;
   if (ownsPlaybackRef.current) stopTts();
  },
  [stopTts],
 );
 return null;
}

function useReaderRuntimeContext(): ReaderRuntimeContextValue {
 const context = useContext(ReaderRuntimeContext);
 if (!context) throw new Error("Reader runtime hooks require ReaderRuntimeProvider");
 return context;
}

export function useReaderRuntimeCommands(): ReaderRuntimeCommands {
 return useReaderRuntimeContext().commands;
}

export function useReaderRuntimeSelector<T>(selector: (state: ReaderRuntimeState) => T): T {
 return useSelector(useReaderRuntimeContext().store, selector);
}

export function useReaderRuntimeActions() {
 return useReaderRuntimeContext().store.actions;
}
