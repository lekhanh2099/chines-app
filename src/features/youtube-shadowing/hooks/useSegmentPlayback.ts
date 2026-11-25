"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { findActiveSegmentIndex } from "../model/transcript-segments";
import type { TranscriptSegment } from "../model/youtube-transcript.schemas";

export type SegmentPlaybackTimeSource = {
 isPlaying: boolean;
 subscribeTime: (listener: (ms: number) => void) => () => void;
 play: () => void;
 pause: () => void;
 seekTo: (ms: number) => void;
};

export type SegmentTimeTickResult = {
 nextActiveIndex: number;
 loopSeekMs: number;
 shouldStopAtEnd: boolean;
};

export function evaluateSegmentTimeTick({
 segments,
 isTimed,
 isPlaying,
 currentMs,
 loopEnabled,
 loopIndex,
 stopAtMs,
}: {
 segments: TranscriptSegment[];
 isTimed: boolean;
 isPlaying: boolean;
 currentMs: number;
 loopEnabled: boolean;
 loopIndex: number;
 stopAtMs: number;
}): SegmentTimeTickResult {
 if (!isTimed || segments.length === 0) {
  return { nextActiveIndex: -1, loopSeekMs: -1, shouldStopAtEnd: false };
 }

 const nextActiveIndex = findActiveSegmentIndex(segments, currentMs);

 if (stopAtMs >= 0 && isPlaying && currentMs >= stopAtMs) {
  return { nextActiveIndex, loopSeekMs: -1, shouldStopAtEnd: true };
 }

 if (loopEnabled && isPlaying && loopIndex >= 0) {
  const targetSegment = segments[loopIndex];
  if (
   targetSegment &&
   targetSegment.endMs > targetSegment.startMs &&
   currentMs >= targetSegment.endMs
  ) {
   return {
    nextActiveIndex: loopIndex,
    loopSeekMs: targetSegment.startMs,
    shouldStopAtEnd: false,
   };
  }
 }

 return { nextActiveIndex, loopSeekMs: -1, shouldStopAtEnd: false };
}

export function useSegmentPlayback({
 player,
 segments,
 isTimed,
}: {
 player: SegmentPlaybackTimeSource;
 segments: TranscriptSegment[];
 isTimed: boolean;
}) {
 const [timedActiveIndex, setTimedActiveIndex] = useState(-1);
 const [manualActiveIndex, setManualActiveIndex] = useState(0);
 const [loopEnabled, setLoopEnabled] = useState(false);
 const [loopIndex, setLoopIndex] = useState(-1);

 const segmentsRef = useRef(segments);
 const isTimedRef = useRef(isTimed);
 const isPlayingRef = useRef(player.isPlaying);
 const loopEnabledRef = useRef(loopEnabled);
 const loopIndexRef = useRef(loopIndex);
 const timedActiveIndexRef = useRef(timedActiveIndex);
 const stopAtMsRef = useRef(-1);
 const stopGuardUntilRef = useRef(0);

 useEffect(() => {
  segmentsRef.current = segments;
 }, [segments]);

 useEffect(() => {
  isTimedRef.current = isTimed;
 }, [isTimed]);

 useEffect(() => {
  isPlayingRef.current = player.isPlaying;
 }, [player.isPlaying]);

 useEffect(() => {
  loopEnabledRef.current = loopEnabled;
 }, [loopEnabled]);

 useEffect(() => {
  loopIndexRef.current = loopIndex;
 }, [loopIndex]);

 useEffect(() => {
  timedActiveIndexRef.current = timedActiveIndex;
 }, [timedActiveIndex]);

 const subscribeTime = player.subscribeTime;
 const seekTo = player.seekTo;
 const pause = player.pause;
 const play = player.play;

 useEffect(() => {
  return subscribeTime((currentMs) => {
   const outcome = evaluateSegmentTimeTick({
    segments: segmentsRef.current,
    isTimed: isTimedRef.current,
    isPlaying: isPlayingRef.current,
    currentMs,
    loopEnabled: loopEnabledRef.current,
    loopIndex: loopIndexRef.current,
    stopAtMs: stopAtMsRef.current,
   });

   if (outcome.shouldStopAtEnd) {
    if (Date.now() < stopGuardUntilRef.current) return;
    stopAtMsRef.current = -1;
    stopGuardUntilRef.current = 0;
    pause();
    return;
   }

   if (outcome.loopSeekMs >= 0) {
    seekTo(outcome.loopSeekMs);
    return;
   }

   if (outcome.nextActiveIndex !== timedActiveIndexRef.current) {
    timedActiveIndexRef.current = outcome.nextActiveIndex;
    setTimedActiveIndex(outcome.nextActiveIndex);
   }
  });
 }, [pause, seekTo, subscribeTime]);

 const activeIndex = isTimed
  ? timedActiveIndex
  : segments.length > 0
    ? Math.min(manualActiveIndex, segments.length - 1)
    : -1;

 const disableLoop = useCallback(() => {
  stopAtMsRef.current = -1;
  loopEnabledRef.current = false;
  loopIndexRef.current = -1;
  setLoopEnabled(false);
  setLoopIndex(-1);
 }, []);

 const toggleLoop = useCallback(() => {
  const currentSegments = segmentsRef.current;
  if (!isTimedRef.current || currentSegments.length === 0) return;
  stopAtMsRef.current = -1;
  setLoopEnabled((current) => {
   const next = !current;
   loopEnabledRef.current = next;
   if (next) {
    const resolvedIndex = timedActiveIndexRef.current >= 0 ? timedActiveIndexRef.current : 0;
    loopIndexRef.current = resolvedIndex;
    setLoopIndex(resolvedIndex);
   }
   return next;
  });
 }, []);

 const selectSegment = useCallback(
  (index: number) => {
   const segment = segmentsRef.current[index];
   if (!segment) return;
   stopAtMsRef.current = -1;
   if (isTimedRef.current) {
    if (loopEnabledRef.current) {
     loopIndexRef.current = index;
     setLoopIndex(index);
    }
    seekTo(segment.startMs);
   } else {
    setManualActiveIndex(index);
   }
  },
  [seekTo],
 );

 const replayActive = useCallback(() => {
  const currentSegments = segmentsRef.current;
  if (!isTimedRef.current || currentSegments.length === 0) return;
  stopAtMsRef.current = -1;
  const targetIndex = timedActiveIndexRef.current >= 0 ? timedActiveIndexRef.current : 0;
  const segment = currentSegments[targetIndex];
  if (!segment) return;
  seekTo(segment.startMs);
  play();
 }, [play, seekTo]);

 const playSegment = useCallback(
  (index: number) => {
   const segment = segmentsRef.current[index];
   if (!isTimedRef.current || !segment) return;
   loopEnabledRef.current = false;
   loopIndexRef.current = -1;
   setLoopEnabled(false);
   setLoopIndex(-1);
   stopAtMsRef.current = segment.endMs > segment.startMs ? segment.endMs : -1;
   const durationMs = Math.max(0, segment.endMs - segment.startMs);
   stopGuardUntilRef.current = Date.now() + Math.min(350, Math.max(0, durationMs - 150));
   seekTo(segment.startMs);
   play();
  },
  [play, seekTo],
 );

 const cancelAutoStop = useCallback(() => {
  stopAtMsRef.current = -1;
 }, []);

 const stepManual = useCallback((delta: number) => {
  const count = segmentsRef.current.length;
  if (count === 0) return;
  setManualActiveIndex((current) => Math.max(0, Math.min(count - 1, current + delta)));
 }, []);

 const resetManualAndLoop = useCallback(() => {
  stopAtMsRef.current = -1;
  loopEnabledRef.current = false;
  loopIndexRef.current = -1;
  timedActiveIndexRef.current = -1;
  setTimedActiveIndex(-1);
  setManualActiveIndex(0);
  setLoopEnabled(false);
  setLoopIndex(-1);
 }, []);

 return {
  activeIndex,
  loopEnabled,
  loopIndex,
  toggleLoop,
  disableLoop,
  selectSegment,
  replayActive,
  playSegment,
  cancelAutoStop,
  stepManual,
  resetManualAndLoop,
 };
}
