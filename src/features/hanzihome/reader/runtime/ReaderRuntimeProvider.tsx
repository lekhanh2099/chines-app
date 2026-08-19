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

const ReaderRuntimeContext = createContext<ReaderRuntimeContextValue | null>(null);

const noRuntimeCommands: ReaderRuntimeCommands = {
 playCurrent: () => undefined,
 playAll: () => undefined,
 pause: () => undefined,
 resume: () => undefined,
 stop: () => undefined,
 restartCurrent: () => undefined,
 previous: () => undefined,
 next: () => undefined,
 selectIndex: () => undefined,
 setRate: () => undefined,
};

export function ReaderRuntimeProvider({
 document,
 children,
}: {
 document: ReaderDocumentModel;
 children: ReactNode;
}) {
 const [store] = useState(() =>
  createReaderRuntimeStore(document.segments.map((segment) => segment.id)),
 );
 const commandsRef = useRef<ReaderRuntimeCommands>(noRuntimeCommands);
 const commands = useMemo<ReaderRuntimeCommands>(
  () => ({
   playCurrent: () => commandsRef.current.playCurrent(),
   playAll: () => commandsRef.current.playAll(),
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
   <ReaderTtsBridge document={document} store={store} commandsRef={commandsRef} />
   {children}
  </ReaderRuntimeContext.Provider>
 );
}

function ReaderTtsBridge({
 document,
 store,
 commandsRef,
}: {
 document: ReaderDocumentModel;
 store: ReaderRuntimeStore;
 commandsRef: { current: ReaderRuntimeCommands };
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
  speakSequence,
  stop: stopTts,
 } = tts;
 const runRef = useRef(0);
 const ownsPlaybackRef = useRef(false);
 const continuousRef = useRef(false);

 const finishPlayback = useCallback(() => {
  ownsPlaybackRef.current = false;
  continuousRef.current = false;
  store.actions.resetPlayback();
 }, [store]);

 const playAtRef = useRef<(index: number, runId: number, continuous: boolean) => void>(
  () => undefined,
 );
 const playAt = useCallback(
  (index: number, runId: number, continuous: boolean) => {
   if (runRef.current !== runId) return;
   const segment = document.segments[index];
   if (!segment) {
    finishPlayback();
    return;
   }
   const speechText = (segment.speechText ?? segment.zh).trim();
   if (!speechText) {
    const nextIndex = index + 1;
    if (continuous && nextIndex < document.segments.length) {
     playAtRef.current(nextIndex, runId, continuous);
    } else {
     finishPlayback();
    }
    return;
   }

   ownsPlaybackRef.current = true;
   continuousRef.current = continuous;
   store.actions.selectIndex(index, "playback");
   store.actions.syncPlayback({
    playbackSegmentId: segment.id,
    playbackStatus: "loading",
    progress: 0,
    rate,
    error: null,
   });
   speakSequence([speechText], () => {
    if (runRef.current !== runId) return;
    const current = store.state;
    if (current.loopCurrent) {
     playAtRef.current(index, runId, continuous);
     return;
    }
    const nextIndex = index + 1;
    if ((continuous || current.autoAdvance) && nextIndex < document.segments.length) {
     playAtRef.current(nextIndex, runId, continuous);
     return;
    }
    finishPlayback();
   });
  },
  [document.segments, finishPlayback, rate, speakSequence, store],
 );

 useEffect(() => {
  playAtRef.current = playAt;
 }, [playAt]);

 const startAt = useCallback(
  (index: number, continuous: boolean) => {
   if (document.segments.length === 0) return;
   runRef.current += 1;
   const runId = runRef.current;
   if (ownsPlaybackRef.current) stopTts();
   ownsPlaybackRef.current = true;
   continuousRef.current = continuous;
   playAt(Math.min(Math.max(index, 0), document.segments.length - 1), runId, continuous);
  },
  [document.segments.length, playAt, stopTts],
 );

 const stop = useCallback(() => {
  runRef.current += 1;
  continuousRef.current = false;
  if (ownsPlaybackRef.current) stopTts();
  finishPlayback();
 }, [finishPlayback, stopTts]);

 const selectIndex = useCallback(
  (index: number) => {
   const nextIndex = Math.min(Math.max(index, 0), Math.max(0, document.segments.length - 1));
   const shouldContinue = ownsPlaybackRef.current && store.state.playbackStatus !== "idle";
   if (shouldContinue) {
    runRef.current += 1;
    const runId = runRef.current;
    stopTts();
    ownsPlaybackRef.current = true;
    playAt(nextIndex, runId, continuousRef.current);
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
   playCurrent: () => startAt(store.state.activeIndex, true),
   playAll: () => startAt(0, true),
   pause: () => {
    if (ownsPlaybackRef.current) pauseTts();
   },
   resume: () => {
    if (ownsPlaybackRef.current) resumeTts();
   },
   stop,
   restartCurrent: () => startAt(store.state.activeIndex, continuousRef.current),
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
  const playbackStatus = isLoading
   ? "loading"
   : isPaused
     ? "paused"
     : isSpeaking
       ? "playing"
       : "idle";
  store.actions.syncPlayback({
   playbackSegmentId: store.state.playbackSegmentId,
   playbackStatus,
   progress,
   rate,
   error,
  });
 }, [error, isLoading, isPaused, isSpeaking, progress, rate, store]);

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
 const { store } = useReaderRuntimeContext();
 return useSelector(store, selector);
}

export function useReaderRuntimeActions() {
 return useReaderRuntimeContext().store.actions;
}
