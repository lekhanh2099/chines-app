"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";

export function useTtsAudioPreview(
 generateAudio: ReturnType<typeof useSharedMandarinTts>["generateAudio"],
 onGenerationError: () => void,
) {
 const [audioUrl, setAudioUrl] = useState("");
 const [isGenerating, setIsGenerating] = useState(false);
 const audioUrlRef = useRef("");
 const mountedRef = useRef(true);
 const requestRef = useRef(0);

 useEffect(() => {
  mountedRef.current = true;
  return () => {
   mountedRef.current = false;
   requestRef.current += 1;
   if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
   audioUrlRef.current = "";
  };
 }, []);

 const prepareAudio = useCallback(
  async (text: string) => {
   if (!mountedRef.current) return false;
   const request = ++requestRef.current;
   setIsGenerating(true);
   try {
    const blob = await generateAudio(text);
    if (!mountedRef.current || requestRef.current !== request) return false;
    if (!blob) {
     onGenerationError();
     return false;
    }
    const nextUrl = URL.createObjectURL(blob);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
    return true;
   } catch {
    if (mountedRef.current && requestRef.current === request) onGenerationError();
    return false;
   } finally {
    if (mountedRef.current && requestRef.current === request) setIsGenerating(false);
   }
  },
  [generateAudio, onGenerationError],
 );

 const clearPreview = useCallback(() => {
  requestRef.current += 1;
  if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  audioUrlRef.current = "";
  setAudioUrl("");
  setIsGenerating(false);
 }, []);

 return { audioUrl, isGenerating, prepareAudio, clearPreview };
}
