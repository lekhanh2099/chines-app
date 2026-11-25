"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const YOUTUBE_IFRAME_API_SRC = "https://www.youtube.com/iframe_api";
const POLL_INTERVAL_MS = 100;
const MIN_TIME_DELTA_MS = 50;

const iframeApiLoader: { pending?: Promise<YoutubeIframeApi> } = {};

function loadYoutubeIframeApi(): Promise<YoutubeIframeApi> {
 if (typeof window === "undefined") {
  return Promise.reject(new Error("YouTube IFrame API requires a browser environment"));
 }

 if (window.YT?.Player) {
  return Promise.resolve(window.YT);
 }

 if (iframeApiLoader.pending) {
  return iframeApiLoader.pending;
 }

 iframeApiLoader.pending = new Promise<YoutubeIframeApi>((resolve, reject) => {
  const previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
   previousReady?.();
   if (window.YT?.Player) {
    resolve(window.YT);
   } else {
    iframeApiLoader.pending = undefined;
    reject(new Error("YouTube IFrame API did not initialize"));
   }
  };

  const existingScript = document.querySelector<HTMLScriptElement>(
   `script[src="${YOUTUBE_IFRAME_API_SRC}"]`,
  );
  if (existingScript) return;

  const script = document.createElement("script");
  script.src = YOUTUBE_IFRAME_API_SRC;
  script.async = true;
  script.onerror = () => {
   script.remove();
   iframeApiLoader.pending = undefined;
   reject(new Error("Failed to load YouTube IFrame API"));
  };
  document.head.appendChild(script);
 });

 return iframeApiLoader.pending;
}

export type YoutubePlayerController = ReturnType<typeof useYoutubePlayer>;

export function useYoutubePlayer(videoId: string) {
 const containerRef = useRef<HTMLDivElement>(null);
 const playerRef = useRef<YoutubePlayerInstance>(undefined);
 const pollTimerRef = useRef<number>(undefined);
 const currentMsRef = useRef(0);
 const timeListenersRef = useRef<Set<(ms: number) => void>>(new Set());

 const [isReady, setIsReady] = useState(false);
 const [isPlaying, setIsPlaying] = useState(false);
 const [hasEnded, setHasEnded] = useState(false);
 const [durationMs, setDurationMs] = useState(0);
 const [errorCode, setErrorCode] = useState(0);

 const emitTime = useCallback((nextMs: number, force = false) => {
  if (!force && Math.abs(nextMs - currentMsRef.current) < MIN_TIME_DELTA_MS) return;
  currentMsRef.current = nextMs;
  for (const listener of timeListenersRef.current) {
   listener(nextMs);
  }
 }, []);

 const stopPolling = useCallback(() => {
  if (pollTimerRef.current === undefined) return;
  window.clearInterval(pollTimerRef.current);
  pollTimerRef.current = undefined;
 }, []);

 const startPolling = useCallback(() => {
  if (pollTimerRef.current !== undefined) return;
  pollTimerRef.current = window.setInterval(() => {
   const player = playerRef.current;
   if (!player) return;
   const seconds = player.getCurrentTime();
   if (!Number.isFinite(seconds)) return;
   emitTime(Math.max(0, Math.round(seconds * 1000)));
  }, POLL_INTERVAL_MS);
 }, [emitTime]);

 useEffect(() => {
  if (!videoId) return;

  let cancelled = false;
  const container = containerRef.current;

  void loadYoutubeIframeApi()
   .then((api) => {
    if (cancelled || !container) return;

    const mountNode = document.createElement("div");
    mountNode.className = "size-full";
    container.replaceChildren(mountNode);

    const player = new api.Player(mountNode, {
     videoId,
     playerVars: {
      playsinline: 1,
      rel: 0,
     },
     events: {
      onReady: (event) => {
       if (cancelled) return;
       const totalSeconds = event.target.getDuration();
       setDurationMs(
        Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds * 1000)) : 0,
       );
       setIsReady(true);
      },
      onStateChange: (event) => {
       if (cancelled) return;
       const state = event.data;
       const playing = state === api.PlayerState.PLAYING;
       const ended = state === api.PlayerState.ENDED;
       setIsPlaying(playing);
       setHasEnded(ended);

       if (playing) {
        const totalSeconds = event.target.getDuration();
        if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
         setDurationMs(Math.round(totalSeconds * 1000));
        }
        const seconds = event.target.getCurrentTime();
        if (Number.isFinite(seconds)) {
         emitTime(Math.max(0, Math.round(seconds * 1000)), true);
        }
        startPolling();
       } else {
        stopPolling();
        const seconds = event.target.getCurrentTime();
        if (Number.isFinite(seconds)) {
         emitTime(Math.max(0, Math.round(seconds * 1000)), true);
        }
       }
      },
      onError: (event) => {
       if (cancelled) return;
       stopPolling();
       setIsPlaying(false);
       setErrorCode(event.data || 2);
      },
     },
    });

    playerRef.current = player;
   })
   .catch(() => {
    if (cancelled) return;
    setErrorCode(5);
   });

  return () => {
   cancelled = true;
   stopPolling();
   const existingPlayer = playerRef.current;
   playerRef.current = undefined;
   if (existingPlayer) {
    try {
     existingPlayer.destroy();
    } catch {
     // Ignore teardown errors when iframe was already detached.
    }
   }
   container?.replaceChildren();
  };
 }, [emitTime, startPolling, stopPolling, videoId]);

 const play = useCallback(() => {
  playerRef.current?.playVideo();
 }, []);

 const pause = useCallback(() => {
  playerRef.current?.pauseVideo();
 }, []);

 const seekTo = useCallback(
  (ms: number) => {
   const safeMs = Math.max(0, Math.round(ms));
   setHasEnded(false);
   playerRef.current?.seekTo(safeMs / 1000, true);
   emitTime(safeMs, true);
  },
  [emitTime],
 );

 const setRate = useCallback((rate: number) => {
  playerRef.current?.setPlaybackRate(rate);
 }, []);

 const getCurrentMs = useCallback(() => currentMsRef.current, []);

 const subscribeTime = useCallback((listener: (ms: number) => void) => {
  timeListenersRef.current.add(listener);
  return () => {
   timeListenersRef.current.delete(listener);
  };
 }, []);

 return useMemo(
  () => ({
   containerRef,
   isReady,
   isPlaying,
   hasEnded,
   durationMs,
   errorCode,
   getCurrentMs,
   subscribeTime,
   play,
   pause,
   seekTo,
   setRate,
  }),
  [
   durationMs,
   errorCode,
   getCurrentMs,
   hasEnded,
   isPlaying,
   isReady,
   pause,
   play,
   seekTo,
   setRate,
   subscribeTime,
  ],
 );
}
