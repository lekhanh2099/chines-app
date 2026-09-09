"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ShadowingRecorderError = "permission-denied" | "recording-failed" | "unsupported";

type RecorderState = {
 audioBlob: Blob | null;
 audioUrl: string | null;
 durationSeconds: number;
 error: ShadowingRecorderError | null;
 isRecording: boolean;
 isRequesting: boolean;
 isSupported: boolean;
};

const initialState: RecorderState = {
 audioBlob: null,
 audioUrl: null,
 durationSeconds: 0,
 error: null,
 isRecording: false,
 isRequesting: false,
 isSupported: false,
};

function supportedMimeType(): string | undefined {
 if (typeof MediaRecorder === "undefined") return undefined;
 const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
 return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}

function detachRecorder(recorder: MediaRecorder) {
 recorder.ondataavailable = null;
 recorder.onerror = null;
 recorder.onstop = null;
}

function browserSupportsRecording() {
 return typeof MediaRecorder !== "undefined" && navigator.mediaDevices?.getUserMedia !== undefined;
}

export function useShadowingRecorder() {
 const [state, setState] = useState<RecorderState>(() => ({
  ...initialState,
  isSupported: browserSupportsRecording(),
 }));
 const recorderRef = useRef<MediaRecorder | null>(null);
 const streamRef = useRef<MediaStream | null>(null);
 const chunksRef = useRef<Blob[]>([]);
 const timerRef = useRef<number | null>(null);
 const audioUrlRef = useRef<string | null>(null);
 const mountedRef = useRef(true);
 const requestIdRef = useRef(0);

 const stopTimer = useCallback(() => {
  if (timerRef.current === null) return;
  window.clearInterval(timerRef.current);
  timerRef.current = null;
 }, []);

 const releaseStream = useCallback(() => {
  streamRef.current?.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
 }, []);

 const releaseAudioUrl = useCallback(() => {
  if (audioUrlRef.current === null) return;
  URL.revokeObjectURL(audioUrlRef.current);
  audioUrlRef.current = null;
 }, []);

 const clear = useCallback(() => {
  releaseAudioUrl();
  setState((current) => ({
   ...current,
   audioBlob: null,
   audioUrl: null,
   durationSeconds: 0,
   error: null,
  }));
 }, [releaseAudioUrl]);

 const stop = useCallback(() => {
  const recorder = recorderRef.current;
  if (recorder === null || recorder.state === "inactive") return;
  recorder.stop();
 }, []);

 const start = useCallback(async (): Promise<boolean> => {
  if (!browserSupportsRecording()) {
   setState((current) => ({ ...current, error: "unsupported", isSupported: false }));
   return false;
  }

  const requestId = requestIdRef.current + 1;
  requestIdRef.current = requestId;
  stop();
  releaseStream();
  releaseAudioUrl();
  chunksRef.current = [];
  setState((current) => ({
   ...current,
   audioBlob: null,
   audioUrl: null,
   durationSeconds: 0,
   error: null,
   isRecording: false,
   isRequesting: true,
   isSupported: true,
  }));

  try {
   const stream = await navigator.mediaDevices.getUserMedia({
    audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true },
   });
   if (!mountedRef.current || requestIdRef.current !== requestId) {
    stream.getTracks().forEach((track) => track.stop());
    return false;
   }

   streamRef.current = stream;
   const mimeType = supportedMimeType();
   const recorder =
    mimeType === undefined ? new MediaRecorder(stream) : new MediaRecorder(stream, { mimeType });
   recorderRef.current = recorder;
   recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunksRef.current.push(event.data);
   };
   recorder.onerror = () => {
    stopTimer();
    releaseStream();
    recorderRef.current = null;
    if (!mountedRef.current) return;
    setState((current) => ({
     ...current,
     error: "recording-failed",
     isRecording: false,
     isRequesting: false,
    }));
   };
   recorder.onstop = () => {
    stopTimer();
    releaseStream();
    recorderRef.current = null;
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    chunksRef.current = [];
    if (!mountedRef.current) return;
    if (blob.size === 0) {
     setState((current) => ({
      ...current,
      error: "recording-failed",
      isRecording: false,
      isRequesting: false,
     }));
     return;
    }
    releaseAudioUrl();
    const audioUrl = URL.createObjectURL(blob);
    audioUrlRef.current = audioUrl;
    setState((current) => ({
     ...current,
     audioBlob: blob,
     audioUrl,
     error: null,
     isRecording: false,
     isRequesting: false,
    }));
   };

   recorder.start(200);
   const startedAt = Date.now();
   timerRef.current = window.setInterval(() => {
    if (!mountedRef.current) return;
    setState((current) => ({
     ...current,
     durationSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1_000)),
    }));
   }, 500);
   setState((current) => ({ ...current, isRecording: true, isRequesting: false }));
   return true;
  } catch (error) {
   releaseStream();
   if (!mountedRef.current || requestIdRef.current !== requestId) return false;
   const denied =
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "SecurityError");
   setState((current) => ({
    ...current,
    error: denied ? "permission-denied" : "recording-failed",
    isRecording: false,
    isRequesting: false,
   }));
   return false;
  }
 }, [releaseAudioUrl, releaseStream, stop, stopTimer]);

 useEffect(() => {
  mountedRef.current = true;
  return () => {
   mountedRef.current = false;
   requestIdRef.current += 1;
   stopTimer();
   const recorder = recorderRef.current;
   if (recorder !== null) {
    detachRecorder(recorder);
    if (recorder.state !== "inactive") recorder.stop();
   }
   recorderRef.current = null;
   chunksRef.current = [];
   releaseStream();
   releaseAudioUrl();
  };
 }, [releaseAudioUrl, releaseStream, stopTimer]);

 return { ...state, clear, start, stop };
}
