"use client";

import { useCallback, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { noteQueryKeys } from "../query-keys";
import type { NoteDetail } from "@/services/notes/notes.service";
import { useClientSession } from "@/components/providers/QueryProvider";
import { useNoteDetail } from "./useNoteDetail";
import { useNoteEditorAutosave } from "./useNoteEditorAutosave";
import { useNoteEditorLibraryImport } from "./useNoteEditorLibraryImport";
import { saveNoteDraft, type NoteDraftRecord } from "../local/note-draft-store";
import { normalizeImportedNotePayload } from "../note-export.schema";
import {
 createNoteDownloadFileName,
 createNoteExportPayload,
 resolveNoteSaveStatus,
} from "../note-editor-utils";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";
import { splitViewStore } from "@/stores/notes/split-view-store";
import { JsonValueSchema } from "@/types/json";

export function useNoteEditor(noteId: string) {
 const detail = useNoteDetail(noteId);
 const queryClient = useQueryClient();
 const { note, stageContent, stageReadingContent, updateTitle, updateCategory, updateSplitView } =
  detail;
 const { userId } = useClientSession();
 const { folders, applyImportedLibraryMetadata } = useNoteEditorLibraryImport({
  noteId,
  userId,
  queryClient,
 });
 const [isImporting, setIsImporting] = useState(false);
 const [importVersion, setImportVersion] = useState(0);
 const importingRef = useRef(false);
 const {
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
 } = useNoteEditorAutosave({ noteId, detail, userId, queryClient, importingRef });

 const exportNote = useCallback(() => {
  if (!note) return;
  const payload = createNoteExportPayload({
   note,
   folders: folders ?? [],
   content: latestContentRef.current ?? note.content,
   readingContent:
    latestReadingRef.current === undefined ? note.reading_content : latestReadingRef.current,
   exportedAt: new Date().toISOString(),
  });
  const url = URL.createObjectURL(
   new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  try {
   link.href = url;
   link.download = createNoteDownloadFileName(note.title);
   document.body.appendChild(link);
   link.click();
  } finally {
   link.remove();
   URL.revokeObjectURL(url);
  }
 }, [folders, latestContentRef, latestReadingRef, note]);

 const importNote = useCallback(
  async (file: File) => {
   if (importingRef.current) return;
   if (!note) throw new Error("Note is not loaded");
   const rawPayload = JsonValueSchema.parse(JSON.parse(await file.text()));
   const payload = normalizeImportedNotePayload(rawPayload);
   const hasLibraryMetadata =
    typeof rawPayload === "object" &&
    rawPayload !== null &&
    "version" in rawPayload &&
    rawPayload.version === 2;
   importingRef.current = true;
   setIsImporting(true);
   try {
    await retrySave();
    const content = payload.note.content;
    const readingContent = payload.note.readingContent ?? null;
    latestContentRef.current = content;
    latestReadingRef.current = readingContent;
    stageContent(content);
    stageReadingContent(readingContent);
    pendingContentRef.current = content;
    pendingReadingRef.current = readingContent;
    setDirtyContent(true);
    setDirtyReading(true);
    setImportVersion((version) => version + 1);
    if (userId) {
     const current = queryClient.getQueryData<NoteDetail>(noteQueryKeys.detail(userId, noteId));
     if (!current) throw new Error("Note is not loaded");
     const saved = await saveNoteDraft(userId, noteId, {
      baseRevision: current.revision,
      content,
      readingContent,
     });
     setLocalDraftFailed({ content: !saved, reading: !saved });
     if (!saved) throw new Error("Local note draft was not saved");
    }
    await retrySave();
    if (payload.note.title !== note?.title) {
     await updateTitle(payload.note.title);
     noteTabsStore.actions.updateTabTitle(noteId, payload.note.title);
    }
    if (payload.note.category !== note?.category) await updateCategory(payload.note.category);
    if (payload.note.splitViewEnabled !== undefined) {
     await updateSplitView(payload.note.splitViewEnabled);
     splitViewStore.actions.setSplitView(noteId, payload.note.splitViewEnabled);
    }
    if (hasLibraryMetadata) await applyImportedLibraryMetadata(payload);
   } finally {
    importingRef.current = false;
    setIsImporting(false);
   }
  },
  [
   applyImportedLibraryMetadata,
   latestContentRef,
   latestReadingRef,
   note,
   pendingContentRef,
   pendingReadingRef,
   queryClient,
   noteId,
   retrySave,
   setDirtyContent,
   setDirtyReading,
   setLocalDraftFailed,
   stageContent,
   stageReadingContent,
   updateCategory,
   updateSplitView,
   updateTitle,
   userId,
  ],
 );

 const resolveConflict = async (useServer: boolean) => {
  if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
  if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
  await detail.resolveConflict(useServer);
  if (useServer) {
   pendingContentRef.current = null;
   pendingReadingRef.current = undefined;
   latestContentRef.current = null;
   latestReadingRef.current = undefined;
   setDirtyContent(false);
   setDirtyReading(false);
   setLocalDraftFailed({ content: false, reading: false });
   setImportVersion((version) => version + 1);
  } else {
   await retrySave();
   latestContentRef.current = null;
   latestReadingRef.current = undefined;
   setImportVersion((version) => version + 1);
  }
 };

 const recoverDraft = async (source: NoteDraftRecord) => {
  const draft = await detail.recoverDraft(source);
  latestContentRef.current = draft.content;
  pendingContentRef.current = draft.content;
  latestReadingRef.current = draft.readingContent;
  pendingReadingRef.current = draft.readingContent;
  setDirtyContent(draft.content !== null);
  setDirtyReading(draft.readingContent !== undefined);
  setImportVersion((version) => version + 1);
 };

 return {
  ...detail,
  handleChange,
  handleReadingChange,
  resolveConflict,
  recoverDraft,
  retrySave,
  exportNote,
  importNote,
  isImporting,
  importVersion,
  noteContent: note?.content ?? null,
  readingContent: note?.reading_content ?? null,
  displaySaveStatus: resolveNoteSaveStatus(
   [detail.saveStatus, detail.readingSaveStatus],
   dirtyContent || dirtyReading,
   localDraftFailed.content || localDraftFailed.reading,
  ),
 };
}
