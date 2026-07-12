"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_UTTERANCE_LENGTH = 140;

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
 }, []);

 const speak = useCallback(
  (text: string) => {
   const normalizedText = text.trim();
   const chunks = splitSpeechText(normalizedText);
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

   let chunkIndex = 0;
   const speakNextChunk = () => {
    if (speechRunRef.current !== runId) return;

    const chunk = chunks[chunkIndex];
    if (!chunk) {
     setIsSpeaking(false);
     return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.voice = selectedVoice;
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
  [rate, selectedVoice],
 );

 return {
  voices,
  selectedVoice,
  selectedVoiceUri,
  setSelectedVoiceUri,
  rate,
  setRate,
  speak,
  stop,
  isSpeaking,
  error,
 };
}
