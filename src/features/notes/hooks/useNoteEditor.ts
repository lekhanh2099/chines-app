"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";
import { useNoteDetail } from "./useNoteDetail";
import {
 useNoteFolderMutations,
 useNoteFolders,
 useUpdateNoteLibraryMetadata,
} from "./useNoteLibrary";
import { getNoteDraft, saveNoteDraft } from "../local/note-draft-store";
import { normalizeImportedNotePayload, type NoteExportPayload } from "../note-export.schema";
import {
 createNoteDownloadFileName,
 createNoteExportPayload,
 resolveNoteSaveStatus,
} from "../note-editor-utils";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";
import { splitViewStore } from "@/stores/notes/split-view-store";
import { JsonValueSchema, type JsonObject } from "@/types/json";

export function useNoteEditor(noteId: string) {
 const detail = useNoteDetail(noteId);
 const {
  note,
  saveContent,
  saveReadingContent,
  stageContent,
  stageReadingContent,
  updateTitle,
  updateCategory,
  updateSplitView,
 } = detail;
 const { userId } = useClientSession();
 const foldersQuery = useNoteFolders();
 const { createMutation: createFolderMutation } = useNoteFolderMutations();
 const metadataMutation = useUpdateNoteLibraryMetadata();
 const [dirtyContent, setDirtyContent] = useState(false);
 const [dirtyReading, setDirtyReading] = useState(false);
 const [localDraftFailed, setLocalDraftFailed] = useState({ content: false, reading: false });
 const [isImporting, setIsImporting] = useState(false);
 const [importVersion, setImportVersion] = useState(0);
 const importingRef = useRef(false);
 const latestContent = useRef<JsonObject>(null);
 const latestReading = useRef<NoteExportPayload["note"]["readingContent"]>(undefined);
 const pendingContent = useRef<JsonObject>(null);
 const pendingReading = useRef<NoteExportPayload["note"]["readingContent"]>(undefined);
 const contentTimer = useRef<ReturnType<typeof setTimeout>>(null);
 const readingTimer = useRef<ReturnType<typeof setTimeout>>(null);
 const hasNote = note !== null;

 const flushContent = useCallback(async () => {
  if (contentTimer.current) clearTimeout(contentTimer.current);
  const snapshot = pendingContent.current;
  if (snapshot === null) return;
  pendingContent.current = null;
  try {
   await saveContent(snapshot);
   if (latestContent.current === snapshot) setDirtyContent(false);
  } catch (error) {
   if (pendingContent.current === null && latestContent.current === snapshot) {
    pendingContent.current = snapshot;
   }
   throw error;
  }
 }, [saveContent]);

 const flushReading = useCallback(async () => {
  if (readingTimer.current) clearTimeout(readingTimer.current);
  const snapshot = pendingReading.current;
  if (snapshot === undefined) return;
  pendingReading.current = undefined;
  try {
   await saveReadingContent(snapshot);
   if (latestReading.current === snapshot) setDirtyReading(false);
  } catch (error) {
   if (pendingReading.current === undefined && latestReading.current === snapshot) {
    pendingReading.current = snapshot;
   }
   throw error;
  }
 }, [saveReadingContent]);

 const handleChange = useCallback(
  (content: JsonObject) => {
   if (importingRef.current) return;
   latestContent.current = content;
   stageContent(content);
   pendingContent.current = content;
   setDirtyContent(true);
   if (userId) {
    void saveNoteDraft(userId, noteId, { content, contentUpdatedAt: Date.now() }).then((saved) =>
     setLocalDraftFailed((current) =>
      current.content === !saved ? current : { ...current, content: !saved },
     ),
    );
   }
   if (contentTimer.current) clearTimeout(contentTimer.current);
   contentTimer.current = setTimeout(() => {
    void flushContent().catch(() => {});
   }, 1000);
  },
  [flushContent, noteId, stageContent, userId],
 );

 const handleReadingChange = useCallback(
  (readingContent: JsonObject) => {
   if (importingRef.current) return;
   latestReading.current = readingContent;
   stageReadingContent(readingContent);
   pendingReading.current = readingContent;
   setDirtyReading(true);
   if (userId) {
    void saveNoteDraft(userId, noteId, {
     content: latestContent.current ?? note?.content ?? {},
     readingContent,
     readingContentUpdatedAt: Date.now(),
    }).then((saved) =>
     setLocalDraftFailed((current) =>
      current.reading === !saved ? current : { ...current, reading: !saved },
     ),
    );
   }
   if (readingTimer.current) clearTimeout(readingTimer.current);
   readingTimer.current = setTimeout(() => {
    void flushReading().catch(() => {});
   }, 1000);
  },
  [flushReading, note?.content, noteId, stageReadingContent, userId],
 );

 const retrySave = useCallback(async () => {
  if ((localDraftFailed.content || localDraftFailed.reading) && userId) {
   const content = latestContent.current;
   const readingContent = latestReading.current;
   const saved = await saveNoteDraft(userId, noteId, {
    content: content ?? note?.content ?? {},
    readingContent,
    contentUpdatedAt: content === null ? undefined : Date.now(),
    readingContentUpdatedAt: readingContent === undefined ? undefined : Date.now(),
   });
   if (!saved) throw new Error("Local note draft was not saved");
   setLocalDraftFailed({ content: false, reading: false });
   pendingContent.current = content;
   pendingReading.current = readingContent;
  }
  await Promise.all([flushContent(), flushReading()]);
 }, [
  flushContent,
  flushReading,
  localDraftFailed.content,
  localDraftFailed.reading,
  note?.content,
  noteId,
  userId,
 ]);

 useEffect(() => {
  if (!hasNote || !userId) return;
  let disposed = false;
  void getNoteDraft(userId, noteId).then((draft) => {
   if (disposed || !draft) return;
   if (draft.content !== null && latestContent.current === null) {
    latestContent.current = draft.content;
    pendingContent.current = draft.content;
    stageContent(draft.content);
    setDirtyContent(true);
    void flushContent().catch(() => {});
   }
   if (draft.readingContent !== undefined && latestReading.current === undefined) {
    latestReading.current = draft.readingContent;
    pendingReading.current = draft.readingContent;
    stageReadingContent(draft.readingContent);
    setDirtyReading(true);
    void flushReading().catch(() => {});
   }
  });
  return () => {
   disposed = true;
  };
 }, [flushContent, flushReading, hasNote, noteId, stageContent, stageReadingContent, userId]);

 useEffect(() => {
  const flush = () => {
   void Promise.all([flushContent(), flushReading()]).catch(() => {});
  };
  window.addEventListener("beforeunload", flush);
  return () => {
   window.removeEventListener("beforeunload", flush);
   if (contentTimer.current) clearTimeout(contentTimer.current);
   if (readingTimer.current) clearTimeout(readingTimer.current);
   flush();
  };
 }, [flushContent, flushReading]);

 const exportNote = useCallback(() => {
  if (!note) return;
  const payload = createNoteExportPayload({
   note,
   folders: foldersQuery.data ?? [],
   content: latestContent.current ?? note.content,
   readingContent:
    latestReading.current === undefined ? note.reading_content : latestReading.current,
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
 }, [foldersQuery.data, note]);

 const importNote = useCallback(
  async (file: File) => {
   if (importingRef.current) return;
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
    latestContent.current = content;
    latestReading.current = readingContent;
    stageContent(content);
    stageReadingContent(readingContent);
    pendingContent.current = content;
    pendingReading.current = readingContent;
    setDirtyContent(true);
    setDirtyReading(true);
    setImportVersion((version) => version + 1);
    if (userId) {
     const saved = await saveNoteDraft(userId, noteId, { content, readingContent });
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
    if (hasLibraryMetadata) {
     let folderId: Parameters<typeof metadataMutation.mutateAsync>[0]["folderId"];
     const folderSpec = payload.note.folder;
     if (folderSpec) {
      let parentId: Parameters<typeof createFolderMutation.mutateAsync>[0]["parentId"] = null;
      if (folderSpec.parentName) {
       parentId =
        foldersQuery.data?.find(
         (folder) => folder.parentId === null && folder.name === folderSpec.parentName,
        )?.id ??
        (
         await createFolderMutation.mutateAsync({
          name: folderSpec.parentName,
          color: folderSpec.color,
         })
        ).id;
      }
      folderId =
       foldersQuery.data?.find(
        (folder) => folder.parentId === parentId && folder.name === folderSpec.name,
       )?.id ??
       (
        await createFolderMutation.mutateAsync({
         name: folderSpec.name,
         parentId,
         color: folderSpec.color,
        })
       ).id;
     } else if (folderSpec === null) folderId = null;
     await metadataMutation.mutateAsync({
      noteId,
      folderId,
      readingStatus: payload.note.readingStatus ?? null,
      source: payload.note.source ?? null,
     });
    }
   } finally {
    importingRef.current = false;
    setIsImporting(false);
   }
  },
  [
   createFolderMutation,
   foldersQuery.data,
   metadataMutation,
   note?.category,
   note?.title,
   noteId,
   retrySave,
   stageContent,
   stageReadingContent,
   updateCategory,
   updateSplitView,
   updateTitle,
   userId,
  ],
 );

 return {
  ...detail,
  handleChange,
  handleReadingChange,
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
