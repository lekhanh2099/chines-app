"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { noteQueryKeys } from "../query-keys";
import type { NoteDetail } from "@/services/notes/notes.service";
import type { useClientSession } from "@/components/providers/QueryProvider";
import type { useNoteDetail } from "./useNoteDetail";
import { getNoteDraft, saveNoteDraft } from "../local/note-draft-store";
import type { NoteExportPayload } from "../note-export.schema";
import type { JsonObject } from "@/types/json";

/**
 * Debounced server autosave and local draft persistence for one note's
 * content and reading content, including draft restore and unload flush.
 */
export function useNoteEditorAutosave({
 noteId,
 detail,
 userId,
 queryClient,
 importingRef,
}: {
 noteId: string;
 detail: ReturnType<typeof useNoteDetail>;
 userId: ReturnType<typeof useClientSession>["userId"];
 queryClient: QueryClient;
 importingRef: RefObject<boolean>;
}) {
 const { note, saveContent, saveReadingContent, stageContent, stageReadingContent } = detail;
 const [dirtyContent, setDirtyContent] = useState(false);
 const [dirtyReading, setDirtyReading] = useState(false);
 const [localDraftFailed, setLocalDraftFailed] = useState({ content: false, reading: false });
 const latestContentRef = useRef<JsonObject>(null);
 const latestReadingRef = useRef<NoteExportPayload["note"]["readingContent"]>(undefined);
 const pendingContentRef = useRef<JsonObject>(null);
 const pendingReadingRef = useRef<NoteExportPayload["note"]["readingContent"]>(undefined);
 const contentTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
 const readingTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
 const hasNote = note !== null;
 const awaitingRecovery = detail.recoverableDrafts.length > 0;

 const flushContent = useCallback(async () => {
  if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
  const snapshot = pendingContentRef.current;
  if (snapshot === null) return;
  pendingContentRef.current = null;
  try {
   await saveContent(snapshot);
   if (latestContentRef.current === snapshot) setDirtyContent(false);
  } catch (error) {
   if (pendingContentRef.current === null && latestContentRef.current === snapshot) {
    pendingContentRef.current = snapshot;
   }
   throw error;
  }
 }, [saveContent]);

 const flushReading = useCallback(async () => {
  if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
  const snapshot = pendingReadingRef.current;
  if (snapshot === undefined) return;
  pendingReadingRef.current = undefined;
  try {
   await saveReadingContent(snapshot);
   if (latestReadingRef.current === snapshot) setDirtyReading(false);
  } catch (error) {
   if (pendingReadingRef.current === undefined && latestReadingRef.current === snapshot) {
    pendingReadingRef.current = snapshot;
   }
   throw error;
  }
 }, [saveReadingContent]);

 const handleChange = useCallback(
  (content: JsonObject) => {
   if (importingRef.current || awaitingRecovery) return;
   const currentNote = queryClient.getQueryData<NoteDetail>(noteQueryKeys.detail(userId, noteId));
   if (!currentNote) return;
   latestContentRef.current = content;
   stageContent(content);
   pendingContentRef.current = content;
   setDirtyContent(true);
   if (userId) {
    void saveNoteDraft(userId, noteId, {
     baseRevision: currentNote.revision,
     content,
     contentUpdatedAt: Date.now(),
    }).then((saved) =>
     setLocalDraftFailed((current) =>
      current.content === !saved ? current : { ...current, content: !saved },
     ),
    );
   }
   if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
   contentTimerRef.current = setTimeout(() => {
    void flushContent().catch(() => {});
   }, 1000);
  },
  [awaitingRecovery, flushContent, importingRef, noteId, queryClient, stageContent, userId],
 );

 const handleReadingChange = useCallback(
  (readingContent: JsonObject) => {
   if (importingRef.current || awaitingRecovery) return;
   const currentNote = queryClient.getQueryData<NoteDetail>(noteQueryKeys.detail(userId, noteId));
   if (!currentNote) return;
   latestReadingRef.current = readingContent;
   stageReadingContent(readingContent);
   pendingReadingRef.current = readingContent;
   setDirtyReading(true);
   if (userId) {
    void saveNoteDraft(userId, noteId, {
     baseRevision: currentNote.revision,
     content: latestContentRef.current ?? currentNote.content,
     readingContent,
     readingContentUpdatedAt: Date.now(),
    }).then((saved) =>
     setLocalDraftFailed((current) =>
      current.reading === !saved ? current : { ...current, reading: !saved },
     ),
    );
   }
   if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
   readingTimerRef.current = setTimeout(() => {
    void flushReading().catch(() => {});
   }, 1000);
  },
  [awaitingRecovery, flushReading, importingRef, noteId, queryClient, stageReadingContent, userId],
 );

 const retrySave = useCallback(async () => {
  if ((localDraftFailed.content || localDraftFailed.reading) && userId && note) {
   const content = latestContentRef.current;
   const readingContent = latestReadingRef.current;
   const saved = await saveNoteDraft(userId, noteId, {
    baseRevision: note.revision,
    content: content ?? note?.content ?? {},
    readingContent,
    contentUpdatedAt: content === null ? undefined : Date.now(),
    readingContentUpdatedAt: readingContent === undefined ? undefined : Date.now(),
   });
   if (!saved) throw new Error("Local note draft was not saved");
   setLocalDraftFailed({ content: false, reading: false });
   pendingContentRef.current = content;
   pendingReadingRef.current = readingContent;
  }
  await Promise.all([flushContent(), flushReading()]);
 }, [
  flushContent,
  flushReading,
  localDraftFailed.content,
  localDraftFailed.reading,
  note,
  noteId,
  userId,
 ]);

 useEffect(() => {
  if (!hasNote || !userId || detail.isLoading) return;
  let disposed = false;
  void getNoteDraft(userId, noteId).then((draft) => {
   if (disposed || !draft) return;
   if (draft.content !== null && latestContentRef.current === null) {
    latestContentRef.current = draft.content;
    pendingContentRef.current = draft.content;
    stageContent(draft.content);
    setDirtyContent(true);
    void flushContent().catch(() => {});
   }
   if (draft.readingContent !== undefined && latestReadingRef.current === undefined) {
    latestReadingRef.current = draft.readingContent;
    pendingReadingRef.current = draft.readingContent;
    stageReadingContent(draft.readingContent);
    setDirtyReading(true);
    void flushReading().catch(() => {});
   }
  });
  return () => {
   disposed = true;
  };
 }, [
  detail.isLoading,
  flushContent,
  flushReading,
  hasNote,
  noteId,
  stageContent,
  stageReadingContent,
  userId,
 ]);

 useEffect(() => {
  const flush = () => {
   void Promise.all([flushContent(), flushReading()]).catch(() => {});
  };
  window.addEventListener("beforeunload", flush);
  return () => {
   window.removeEventListener("beforeunload", flush);
   if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
   if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
   flush();
  };
 }, [flushContent, flushReading]);

 return {
  dirtyContent,
  setDirtyContent,
  dirtyReading,
  setDirtyReading,
  localDraftFailed,
  setLocalDraftFailed,
  latestContentRef,
  latestReadingRef,
  pendingContentRef,
  pendingReadingRef,
  contentTimerRef,
  readingTimerRef,
  handleChange,
  handleReadingChange,
  retrySave,
 };
}
