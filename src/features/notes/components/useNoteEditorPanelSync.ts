"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "@tanstack/react-store";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { useNoteEditor } from "@/features/notes/hooks/useNoteEditor";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";
import { selectNoteSplitView, splitViewStore } from "@/stores/notes/split-view-store";

type NoteEditorState = ReturnType<typeof useNoteEditor>;

/**
 * Keeps the note tab title and split view store in sync with the loaded note,
 * and owns the split view toggle (button + Ctrl+Shift+S shortcut).
 */
export function useNoteEditorPanelSync({
 noteId,
 isVisible,
 note,
 isImporting,
 updateSplitView,
}: {
 noteId: string;
 isVisible: boolean;
 note: NoteEditorState["note"];
 isImporting: NoteEditorState["isImporting"];
 updateSplitView: NoteEditorState["updateSplitView"];
}) {
 const t = useTranslations("Notes.editor");
 const { updateTabTitle } = noteTabsStore.actions;
 const isSplitView = useSelector(splitViewStore, selectNoteSplitView(noteId));
 const { toggleSplitView } = splitViewStore.actions;
 const splitViewSynced = useRef(false);

 useEffect(() => {
  if (note?.title) {
   updateTabTitle(noteId, note.title);
  }
 }, [note?.title, noteId, updateTabTitle]);

 const { setSplitView } = splitViewStore.actions;
 useEffect(() => {
  if (note && !splitViewSynced.current) {
   if (note.split_view_enabled) {
    setSplitView(noteId, true);
   }
   splitViewSynced.current = true;
  }
 }, [note, noteId, setSplitView]);

 const handleToggleSplitView = useCallback(() => {
  if (isImporting) return;
  toggleSplitView(noteId);
  const nextState = !isSplitView;
  void updateSplitView(nextState).then(
   () => toast.success(nextState ? t("splitEnabled") : t("splitDisabled")),
   () => {
    toast.error(t("save.error"));
   },
  );
 }, [isImporting, isSplitView, noteId, t, toggleSplitView, updateSplitView]);

 useEffect(() => {
  const handler = (event: KeyboardEvent) => {
   if (event.ctrlKey && event.shiftKey && event.key === "S" && isVisible) {
    event.preventDefault();
    handleToggleSplitView();
   }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
 }, [handleToggleSplitView, isVisible]);

 return { isSplitView, handleToggleSplitView };
}
