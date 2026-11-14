"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { useUnsavedDraftGuard } from "@/components/layout/navigation/UnsavedDraftNavigationGuard";

import type {
 createTranslationRecordingSubmission,
 HumanitiesUnitMark,
} from "./translation-workspace-utils";
import type { useTranslationAttempts } from "./useTranslationAttempts";
import { useTranslationRecording } from "./useTranslationRecording";

type TranslationAttempts = ReturnType<typeof useTranslationAttempts>;

export function useTranslationAnswerDrafts({
 selectedIdValue,
 recordingContext,
 submitAttempt,
 saveError,
 clearSaveError,
}: {
 selectedIdValue: string;
 recordingContext: Parameters<typeof createTranslationRecordingSubmission>[0];
 submitAttempt: TranslationAttempts["submitAttempt"];
 saveError: TranslationAttempts["saveError"];
 clearSaveError: TranslationAttempts["clearSaveError"];
}) {
 const [drafts, setDrafts] = useState<Record<string, string>>({});
 const [backTranslations, setBackTranslations] = useState<Record<string, string>>({});
 const [checked, setChecked] = useState<Record<string, boolean>>({});
 const [interpretingNotes, setInterpretingNotes] = useState("");
 const [learnerTranscript, setLearnerTranscript] = useState("");
 const [submittedRecording, setSubmittedRecording] = useState({ notes: "", transcript: "" });
 const [unitMarks, setUnitMarks] = useState<Record<string, HumanitiesUnitMark>>({});
 const startedAtRef = useRef<Record<string, number>>({});
 const navigationRevisionRef = useRef(0);
 const displayedDocumentIdRef = useRef(selectedIdValue);

 const requestNavigation = useUnsavedDraftGuard(
  Object.entries(drafts).some(
   ([draftKey, value]) => value.trim().length > 0 && (!checked[draftKey] || Boolean(saveError)),
  ) ||
   Object.values(backTranslations).some((value) => value.trim().length > 0) ||
   (interpretingNotes.trim().length > 0 && interpretingNotes !== submittedRecording.notes) ||
   (learnerTranscript.trim().length > 0 && learnerTranscript !== submittedRecording.transcript),
 );
 const recordingRevision = navigationRevisionRef.current;
 const { recorder, startRecording } = useTranslationRecording({
  context: recordingContext,
  answer: { transcript: learnerTranscript, notes: interpretingNotes, unitMarks },
  submitAttempt,
  onSaved: (answer) => {
   if (navigationRevisionRef.current !== recordingRevision) return;
   setSubmittedRecording({ notes: answer.notes, transcript: answer.transcript });
  },
 });

 useLayoutEffect(() => {
  if (displayedDocumentIdRef.current === selectedIdValue) return;
  displayedDocumentIdRef.current = selectedIdValue;
  navigationRevisionRef.current += 1;
  setDrafts((current) =>
   Object.fromEntries(Object.entries(current).filter(([draftKey]) => checked[draftKey])),
  );
  setBackTranslations({});
  startedAtRef.current = {};
  setInterpretingNotes("");
  setLearnerTranscript("");
  setSubmittedRecording({ notes: "", transcript: "" });
  clearSaveError();
 }, [checked, clearSaveError, selectedIdValue]);

 const resetDocumentDrafts = (documentId: string) => {
  displayedDocumentIdRef.current = documentId;
  navigationRevisionRef.current += 1;
  setDrafts((current) =>
   Object.fromEntries(Object.entries(current).filter(([draftKey]) => checked[draftKey])),
  );
  setBackTranslations({});
  startedAtRef.current = {};
  setInterpretingNotes("");
  setLearnerTranscript("");
  setSubmittedRecording({ notes: "", transcript: "" });
 };

 return {
  drafts,
  setDrafts,
  backTranslations,
  setBackTranslations,
  checked,
  setChecked,
  interpretingNotes,
  setInterpretingNotes,
  learnerTranscript,
  setLearnerTranscript,
  unitMarks,
  setUnitMarks,
  startedAtRef,
  requestNavigation,
  recorder,
  startRecording,
  resetDocumentDrafts,
 };
}
