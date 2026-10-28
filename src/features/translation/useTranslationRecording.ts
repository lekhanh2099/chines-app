"use client";

import { useEffect, useRef } from "react";
import { useShadowingRecorder } from "@/features/reading/hooks/useShadowingRecorder";
import { createTranslationRecordingSubmission } from "./translation-workspace-utils";
import type { useTranslationAttempts } from "./useTranslationAttempts";

export function useTranslationRecording({
 context,
 answer,
 submitAttempt,
 onSaved,
}: {
 context: Parameters<typeof createTranslationRecordingSubmission>[0];
 answer: Omit<Parameters<typeof createTranslationRecordingSubmission>[1], "durationSeconds">;
 submitAttempt: ReturnType<typeof useTranslationAttempts>["submitAttempt"];
 onSaved: (answer: Parameters<typeof createTranslationRecordingSubmission>[1]) => void;
}) {
 const recorder = useShadowingRecorder();
 const recordingContextRef = useRef(context);
 const lastRecordingRef = useRef<ReturnType<typeof useShadowingRecorder>["audioBlob"]>(null);

 useEffect(() => {
  const captured = recordingContextRef.current;
  if (!captured.contentId || recorder.audioBlob === null) return;
  if (lastRecordingRef.current === recorder.audioBlob) return;
  lastRecordingRef.current = recorder.audioBlob;
  const submittedAnswer = {
   transcript: answer.transcript,
   notes: answer.notes,
   unitMarks: answer.unitMarks,
   durationSeconds: recorder.durationSeconds,
  };
  submitAttempt(createTranslationRecordingSubmission(captured, submittedAnswer), {
   onSuccess: () => onSaved(submittedAnswer),
  });
 }, [
  answer.notes,
  answer.transcript,
  answer.unitMarks,
  recorder.audioBlob,
  recorder.durationSeconds,
  submitAttempt,
  onSaved,
 ]);

 const startRecording = () => {
  recordingContextRef.current = context;
  recorder.clear();
  void recorder.start();
 };

 return { recorder, startRecording };
}
