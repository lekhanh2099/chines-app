"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_UTTERANCE_LENGTH = 140;

export type MandarinVoiceProfile = "male" | "female" | "neutral";
export type MandarinSpeechSegment = { text: string; voice?: MandarinVoiceProfile };

function normalizeLanguage(language: string) {
 return language.trim().toLowerCase().replaceAll("_", "-");
}

function isMainlandMandarinVoice(voice: SpeechSynthesisVoice) {
 const language = normalizeLanguage(voice.lang);
 return language === "zh-cn" || language === "zh-hans-cn" || language === "cmn-cn";
}

function voiceScore(voice: SpeechSynthesisVoice) {
 const language = normalizeLanguage(voice.lang);
 const name = voice.name.toLowerCase();
 let score = language === "zh-cn" ? 20 : 10;
 if (/普通话|mandarin|putonghua/u.test(name)) score += 8;
 if (/google|microsoft|apple/u.test(name)) score += 3;
 if (voice.default) score += 1;
 return score;
}

function inferredVoiceProfile(voice: SpeechSynthesisVoice): MandarinVoiceProfile | null {
 const name = voice.name.toLowerCase();
 if (/\b(female|woman)\b|女|tingting|xiaoxiao|huihui|yaoyao|meijia|sinji/u.test(name)) {
  return "female";
 }
 if (/\b(male|man)\b|男|kangkang|yunxi|yunyang|yunjian|li-mu/u.test(name)) {
  return "male";
 }
 return null;
}

function voiceForProfile(
 voices: SpeechSynthesisVoice[],
 profile: MandarinVoiceProfile | undefined,
 fallback: SpeechSynthesisVoice | null,
) {
 if (!profile || profile === "neutral") return fallback;
 const explicitMatch = voices.find((voice) => inferredVoiceProfile(voice) === profile);
 if (explicitMatch) return explicitMatch;

 if (voices.length > 1) {
  return profile === "female" ? (voices[0] ?? fallback) : (voices[1] ?? fallback);
 }
 return fallback;
}

function splitSpeechText(text: string) {
 const segments = text
  .split(/(?<=[。！？!?；;\n])/u)
  .map((segment) => segment.trim())
  .filter(Boolean);
 const chunks: string[] = [];

 for (const segment of segments) {
  for (let offset = 0; offset < segment.length; offset += MAX_UTTERANCE_LENGTH) {
   chunks.push(segment.slice(offset, offset + MAX_UTTERANCE_LENGTH));
  }
 }

 return chunks;
}

export function useNativeMandarinTts() {
 const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
 const [selectedVoiceUri, setSelectedVoiceUri] = useState("");
 const [isSpeaking, setIsSpeaking] = useState(false);
 const [speakingText, setSpeakingText] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [rate, setRate] = useState(1);
 const speechRunRef = useRef(0);

 useEffect(() => {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
   const unsupportedTimer = globalThis.setTimeout(
    () => setError("Trình duyệt này không hỗ trợ TTS native."),
    0,
   );
   return () => globalThis.clearTimeout(unsupportedTimer);
  }

  const synth = window.speechSynthesis;
  const loadVoices = () => {
   const nextVoices = synth
    .getVoices()
    .filter(isMainlandMandarinVoice)
    .toSorted((left, right) => voiceScore(right) - voiceScore(left));
   setVoices(nextVoices);
   setSelectedVoiceUri((current) =>
    nextVoices.some((voice) => voice.voiceURI === current)
     ? current
     : (nextVoices[0]?.voiceURI ?? ""),
   );
   setError(
    nextVoices.length > 0 ? null : "Thiết bị chưa có giọng Mandarin Trung Quốc đại lục (zh-CN).",
   );
  };

  synth.addEventListener("voiceschanged", loadVoices);
  const initialTimer = window.setTimeout(loadVoices, 0);
  const retryTimer = window.setTimeout(loadVoices, 300);

  return () => {
   speechRunRef.current += 1;
   window.clearTimeout(initialTimer);
   window.clearTimeout(retryTimer);
   synth.removeEventListener("voiceschanged", loadVoices);
   synth.cancel();
  };
 }, []);

 const selectedVoice = useMemo(
  () => voices.find((voice) => voice.voiceURI === selectedVoiceUri) ?? voices[0] ?? null,
  [selectedVoiceUri, voices],
 );

 const stop = useCallback(() => {
  speechRunRef.current += 1;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  setIsSpeaking(false);
  setSpeakingText(null);
 }, []);

 const speakSequence = useCallback(
  (segments: MandarinSpeechSegment[]) => {
   const normalizedSegments = segments
    .map((segment) => ({ ...segment, text: segment.text.trim() }))
    .filter((segment) => segment.text.length > 0);
   const chunks = normalizedSegments.flatMap((segment) =>
    splitSpeechText(segment.text).map((text) => ({ text, voice: segment.voice })),
   );
   const normalizedText = normalizedSegments.map((segment) => segment.text).join("\n");
   if (chunks.length === 0 || !selectedVoice || !("speechSynthesis" in window)) {
    setError("Không tìm thấy giọng Mandarin zh-CN phù hợp nên TTS đã không phát.");
    return;
   }

   const synth = window.speechSynthesis;
   const runId = speechRunRef.current + 1;
   speechRunRef.current = runId;
   synth.cancel();
   setError(null);
   setIsSpeaking(true);
   setSpeakingText(normalizedText);

   let chunkIndex = 0;
   const speakNextChunk = () => {
    if (speechRunRef.current !== runId) return;

    const chunk = chunks[chunkIndex];
    if (!chunk) {
     setIsSpeaking(false);
     setSpeakingText(null);
     return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.voice = voiceForProfile(voices, chunk.voice, selectedVoice);
    utterance.lang = "zh-CN";
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onend = () => {
     if (speechRunRef.current !== runId) return;
     chunkIndex += 1;
     speakNextChunk();
    };
    utterance.onerror = (event) => {
     if (speechRunRef.current !== runId) return;
     speechRunRef.current += 1;
     setIsSpeaking(false);
     setSpeakingText(null);
     setError(
      event.error === "not-allowed"
       ? "Trình duyệt đang chặn phát giọng nói. Hãy chạm lại nút đọc."
       : `Giọng Mandarin native không phát được (${event.error || "unknown"}).`,
     );
    };
    synth.resume();
    synth.speak(utterance);
   };

   // Chromium online voices can report `interrupted` when cancel() and speak()
   // happen in the same task. A short hand-off keeps the new queue stable.
   window.setTimeout(speakNextChunk, 40);
  },
  [rate, selectedVoice, voices],
 );

 const speak = useCallback(
  (text: string, voice?: MandarinVoiceProfile) => speakSequence([{ text, voice }]),
  [speakSequence],
 );

 return {
  voices,
  selectedVoice,
  selectedVoiceUri,
  setSelectedVoiceUri,
  rate,
  setRate,
  speak,
  speakSequence,
  stop,
  isSpeaking,
  speakingText,
  error,
 };
}
