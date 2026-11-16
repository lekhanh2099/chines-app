"use client";

import { useCallback, useRef, useState } from "react";
import type { LexicalEditor } from "lexical";
import { $getSelection, $isRangeSelection } from "lexical";
import { toast } from "sonner";

import type { NoteListItem } from "@/services/notes/notes.service";
import { $createInlineNoteNode } from "../nodes/InlineNoteNode";
import { $createInternalLinkNode } from "../nodes/InternalLinkNode";
import { preserveEditorSelection } from "./preserve-editor-selection";

/**
 * The two mutually exclusive floating-menu panels (note link search and inline
 * note): their open flags, drafts, focus targets and actions.
 */
export function useFloatingMenuPanels(editor: LexicalEditor) {
 const [showLinkSearch, setShowLinkSearch] = useState(false);
 const [linkSearchQuery, setLinkSearchQuery] = useState("");
 const [linkSearchResults, setLinkSearchResults] = useState<NoteListItem[]>([]);
 const [isSearching, setIsSearching] = useState(false);
 const [showInlineNote, setShowInlineNote] = useState(false);
 const [inlineNoteDraft, setInlineNoteDraft] = useState("");
 const linkSearchInputRef = useRef<HTMLInputElement>(null);
 const inlineNoteTextareaRef = useRef<HTMLTextAreaElement>(null);

 const resetPanels = useCallback(() => {
  setShowLinkSearch(false);
  setLinkSearchQuery("");
  setLinkSearchResults([]);
  setShowInlineNote(false);
  setInlineNoteDraft("");
 }, []);

 const closePanels = useCallback(() => {
  setShowLinkSearch(false);
  setShowInlineNote(false);
 }, []);

 const openLinkSearch = useCallback(() => {
  setShowLinkSearch(true);
  setShowInlineNote(false);
  requestAnimationFrame(() => {
   linkSearchInputRef.current?.focus();
  });
 }, []);

 const handleLinkSearch = useCallback(async (query: string) => {
  setLinkSearchQuery(query);
  if (!query.trim()) {
   setLinkSearchResults([]);
   return;
  }

  setIsSearching(true);
  try {
   const response = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`);
   if (response.ok) {
    const data = await response.json();
    setLinkSearchResults(data.notes || []);
   }
  } catch {
   setLinkSearchResults([]);
  } finally {
   setIsSearching(false);
  }
 }, []);

 const handleInsertNoteLink = useCallback(
  (noteItem: NoteListItem) => {
   editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const linkText = selection.getTextContent() || noteItem.title;
    selection.removeText();
    const linkNode = $createInternalLinkNode(noteItem.id, noteItem.title, linkText);
    selection.insertNodes([linkNode]);
   });
   toast.success(`Đã liên kết đến "${noteItem.title}"`);
   setShowLinkSearch(false);
   setLinkSearchQuery("");
   setLinkSearchResults([]);
  },
  [editor],
 );

 const handleToggleLinkSearch = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  const next = !showLinkSearch;
  setShowLinkSearch(next);
  setShowInlineNote(false);
  if (next) requestAnimationFrame(() => linkSearchInputRef.current?.focus());
 };

 const handleToggleInlineNote = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  const next = !showInlineNote;
  setShowInlineNote(next);
  setShowLinkSearch(false);
  if (next) {
   setInlineNoteDraft("");
   requestAnimationFrame(() => inlineNoteTextareaRef.current?.focus());
  }
 };

 const handleSaveInlineNote = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  if (!inlineNoteDraft.trim()) return;

  editor.update(() => {
   const selection = $getSelection();
   if (!$isRangeSelection(selection)) return;

   const text = selection.getTextContent();
   selection.removeText();
   selection.insertNodes([$createInlineNoteNode(text, inlineNoteDraft.trim())]);
  });

  toast.success("Đã lưu ghi chú nhanh");
  setShowInlineNote(false);
  setInlineNoteDraft("");
 };

 return {
  linkSearch: {
   isOpen: showLinkSearch,
   setIsOpen: setShowLinkSearch,
   query: linkSearchQuery,
   results: linkSearchResults,
   isSearching,
   inputRef: linkSearchInputRef,
   search: handleLinkSearch,
   insertNoteLink: handleInsertNoteLink,
   toggle: handleToggleLinkSearch,
  },
  inlineNote: {
   isOpen: showInlineNote,
   draft: inlineNoteDraft,
   setDraft: setInlineNoteDraft,
   textareaRef: inlineNoteTextareaRef,
   toggle: handleToggleInlineNote,
   save: handleSaveInlineNote,
  },
  resetPanels,
  closePanels,
  openLinkSearch,
 };
}
