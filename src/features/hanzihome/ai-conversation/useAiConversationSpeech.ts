"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject } from "react";
import { useTranslations } from "next-intl";

import type { RetryTurn } from "./ai-conversation-workspace-utils";

interface BrowserSpeechRecognition {
 lang: string;
 continuous: boolean;
 interimResults: boolean;
 onstart: () => void;
 onresult: (event: SpeechRecognitionEvent) => void;
 onerror: (event: SpeechRecognitionErrorEvent) => void;
 onend: () => void;
 start(): void;
 stop(): void;
 abort(): void;
}

declare global {
 interface Window {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
 }
}

export function useAiConversationSpeech({
 conversationIdFromUrl,
 draft,
 setDraft,
 retryTurnRef,
}: {
 conversationIdFromUrl: string | null;
 draft: string;
 setDraft: Dispatch<string>;
 retryTurnRef: RefObject<RetryTurn | null>;
}) {
 const t = useTranslations("AiConversation");
 const [isSpeechSupported, setIsSpeechSupported] = useState(false);
 const [isListening, setIsListening] = useState(false);
 const [isSpeechPending, setIsSpeechPending] = useState(false);
 const [speechError, setSpeechError] = useState("");
 const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);

 const abortSpeech = useCallback(() => {
  setSpeechError("");
  const recognition = speechRecognitionRef.current;
  if (!recognition) return;
  speechRecognitionRef.current = null;
  recognition.abort();
  setIsListening(false);
  setIsSpeechPending(false);
 }, [setSpeechError, setIsListening, setIsSpeechPending]);

 useEffect(() => {
  const frame = window.requestAnimationFrame(() => {
   setIsSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  });
  return () => {
   window.cancelAnimationFrame(frame);
  };
 }, []);

 useEffect(() => () => abortSpeech(), [abortSpeech, conversationIdFromUrl]);

 const toggleSpeech = () => {
  const activeRecognition = speechRecognitionRef.current;
  if (activeRecognition) {
   setIsSpeechPending(true);
   activeRecognition.stop();
   return;
  }

  const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
   setSpeechError(t("message.speechUnsupported"));
   return;
  }

  try {
   const recognition = new SpeechRecognition();
   const baseDraft = draft;
   recognition.lang = "zh-CN";
   recognition.continuous = false;
   recognition.interimResults = true;
   recognition.onstart = () => {
    if (speechRecognitionRef.current !== recognition) return;
    setIsSpeechPending(false);
    setIsListening(true);
   };
   recognition.onresult = (event) => {
    if (speechRecognitionRef.current !== recognition) return;
    let transcript = "";
    for (let index = 0; index < event.results.length; index += 1) {
     transcript += event.results[index][0]?.transcript ?? "";
    }
    setDraft(`${baseDraft}${baseDraft && transcript ? " " : ""}${transcript}`.slice(0, 6000));
    retryTurnRef.current = null;
   };
   recognition.onerror = (event) => {
    if (speechRecognitionRef.current !== recognition || event.error === "aborted") return;
    speechRecognitionRef.current = null;
    setIsListening(false);
    setIsSpeechPending(false);
    const errorKey =
     event.error === "not-allowed" || event.error === "service-not-allowed"
      ? "message.speechPermissionError"
      : event.error === "no-speech"
        ? "message.speechNoSpeech"
        : event.error === "audio-capture"
          ? "message.speechMicrophoneError"
          : "message.speechStartError";
    setSpeechError(t(errorKey));
   };
   recognition.onend = () => {
    if (speechRecognitionRef.current !== recognition) return;
    speechRecognitionRef.current = null;
    setIsListening(false);
    setIsSpeechPending(false);
   };
   speechRecognitionRef.current = recognition;
   setSpeechError("");
   setIsSpeechPending(true);
   recognition.start();
  } catch {
   speechRecognitionRef.current = null;
   setIsListening(false);
   setIsSpeechPending(false);
   setSpeechError(t("message.speechStartError"));
  }
 };

 return {
  isSpeechSupported,
  isListening,
  isSpeechPending,
  speechError,
  speechRecognitionRef,
  abortSpeech,
  toggleSpeech,
 };
}
