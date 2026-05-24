"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $patchStyleText } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
 $getSelection,
 $isRangeSelection,
 $isTextNode,
 COMMAND_PRIORITY_LOW,
 COMMAND_PRIORITY_CRITICAL,
 FORMAT_TEXT_COMMAND,
 KEY_DOWN_COMMAND,
 SELECTION_CHANGE_COMMAND,
 type TextFormatType,
} from "lexical";
import {
 BookmarkPlus,
 Bold,
 Check,
 ChevronRight,
 Code,
 Highlighter,
 Italic,
 Link2,
 Loader2,
 NotebookPen,
 RemoveFormatting,
 Save,
 Search,
 StickyNote,
 Strikethrough,
 Subscript,
 Superscript,
 Underline,
 Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { extractChinese } from "@/lib/chinese-utils";
import { cn } from "@/lib/utils";
import { useDictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { useVocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import { usePathname } from "next/navigation";
import { $createInternalLinkNode } from "./nodes/InternalLinkNode";
import { $createInlineNoteNode } from "./nodes/InlineNoteNode";
import type { NoteListItem } from "@/services/notes.service";
type SelectionAnchor = {
 getBoundingClientRect: () => DOMRect;
 contextElement?: Element | null;
};

type DraftSelection = {
 text: string;
 contextSentence: string;
};

const DEBOUNCE_DELAY = 500;

function preserveEditorSelection(event: React.SyntheticEvent) {
 event.preventDefault();
 event.stopPropagation();
}

function FormatButton({
 active,
 onClick,
 title,
 children,
}: {
 active?: boolean;
 onClick: () => void;
 title: string;
 children: React.ReactNode;
}) {
 return (
  <Button
   variant="ghost"
   size="icon-sm"
   className={cn(
    "h-8 w-8 min-w-0 rounded-xl border border-transparent px-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    active && "border-indigo-200 bg-indigo-50 text-indigo-600",
   )}
   onMouseDown={preserveEditorSelection}
   onClick={(event) => {
    preserveEditorSelection(event);
    onClick();
   }}
   aria-label={title}
   title={title}
  >
   {children}
  </Button>
 );
}

export default function EditorFloatingMenu() {
 const [editor] = useLexicalComposerContext();
 const [isViewportHidden, setIsViewportHidden] = useState(false);
 const [hasAnchor, setHasAnchor] = useState(false);
 const [showNote, setShowNote] = useState(false);
 const [noteDraft, setNoteDraft] = useState("");
 const [noteSelectionKey, setNoteSelectionKey] = useState("");
 const [showLinkSearch, setShowLinkSearch] = useState(false);
 const [linkSearchQuery, setLinkSearchQuery] = useState("");
 const [linkSearchResults, setLinkSearchResults] = useState<NoteListItem[]>([]);
 const [isSearching, setIsSearching] = useState(false);
 const [showInlineNote, setShowInlineNote] = useState(false);
 const [inlineNoteDraft, setInlineNoteDraft] = useState("");
 const [draftSelection, setDraftSelection] = useState<DraftSelection>({
  text: "",
  contextSentence: "",
 });
 const [isBold, setIsBold] = useState(false);
 const [isItalic, setIsItalic] = useState(false);
 const [isUnderline, setIsUnderline] = useState(false);
 const [isStrikethrough, setIsStrikethrough] = useState(false);
 const [isSubscript, setIsSubscript] = useState(false);
 const [isSuperscript, setIsSuperscript] = useState(false);
 const [isCode, setIsCode] = useState(false);
 const [isHighlight, setIsHighlight] = useState(false);
 const selectionAnchorRef = useRef<SelectionAnchor | null>(null);
 const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
 const linkSearchInputRef = useRef<HTMLInputElement | null>(null);
 const inlineNoteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
 const latestDraftRef = useRef<DraftSelection>({
  text: "",
  contextSentence: "",
 });
 const pathname = usePathname();
 const lookupEnabled = useDictionaryLookupStore((s) => s.isEnabled(pathname));
 const openDetailDrawer = useVocabDetailDrawerStore(
  (state) => state.openDetailDrawer,
 );

 const debouncedSelection = useDebounce(draftSelection, DEBOUNCE_DELAY);
 const selectedText = debouncedSelection.text;
 const contextSentence = debouncedSelection.contextSentence;
 const selectionKey = `${selectedText}::${contextSentence}`;

 const {
  data: smartData,
  isLoading: smartLoading,
  isError: smartError,
  error,
  mode,
  isChineseSelection,
  saveSelection,
  isSaving,
 } = useSmartSelectionInsights(selectedText, contextSentence, {
  enabled: lookupEnabled,
 });

 const smartMode = smartData?.mode || mode;
 const detailTarget =
  smartData?.entry.hanzi || extractChinese(selectedText) || selectedText;

 const updateAnchorFromNativeSelection = useCallback(() => {
  const nativeSelection = window.getSelection();
  if (
   !nativeSelection ||
   nativeSelection.isCollapsed ||
   nativeSelection.rangeCount === 0
  ) {
   selectionAnchorRef.current = null;
   setHasAnchor(false);
   return false;
  }

  const rect = nativeSelection.getRangeAt(0).getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
   selectionAnchorRef.current = null;
   setHasAnchor(false);
   return false;
  }

  selectionAnchorRef.current = {
   getBoundingClientRect: () => rect,
   contextElement: editor.getRootElement(),
  };
  setHasAnchor(true);
  return true;
 }, [editor]);

 const getAnchor = useCallback(
  () => selectionAnchorRef.current as unknown as Element | null,
  [],
 );

 const clearSelectionState = useCallback(() => {
  latestDraftRef.current = { text: "", contextSentence: "" };
  setDraftSelection({ text: "", contextSentence: "" });
  setIsViewportHidden(false);
  setHasAnchor(false);
  setShowNote(false);
  setNoteDraft("");
  setNoteSelectionKey("");
  setShowLinkSearch(false);
  setLinkSearchQuery("");
  setLinkSearchResults([]);
  setShowInlineNote(false);
  setInlineNoteDraft("");
  selectionAnchorRef.current = null;
 }, []);

 const updateSelectionState = useCallback(() => {
  const selection = $getSelection();
  const nativeSelection = window.getSelection();

  if (
   !$isRangeSelection(selection) ||
   selection.isCollapsed() ||
   !nativeSelection ||
   nativeSelection.isCollapsed
  ) {
   if (
    (showNote || showLinkSearch || showInlineNote) &&
    latestDraftRef.current.text
   ) {
    return;
   }
   clearSelectionState();
   return;
  }

  const nextText =
   nativeSelection.toString().trim() || selection.getTextContent().trim();
  if (!nextText) {
   clearSelectionState();
   return;
  }

  const anchorNode = selection.anchor.getNode();
  const blockText = anchorNode
   .getTopLevelElement()
   ?.getTextContent()
   .replace(/\s+/g, " ")
   .trim();
  const nextDraft = {
   text: nextText,
   contextSentence:
    blockText && blockText.includes(nextText) ? blockText : nextText,
  };

  setIsBold(selection.hasFormat("bold"));
  setIsItalic(selection.hasFormat("italic"));
  setIsUnderline(selection.hasFormat("underline"));
  setIsStrikethrough(selection.hasFormat("strikethrough"));
  setIsSubscript(selection.hasFormat("subscript"));
  setIsSuperscript(selection.hasFormat("superscript"));
  setIsCode(selection.hasFormat("code"));

  if ($isTextNode(anchorNode)) {
   setIsHighlight(anchorNode.getStyle().includes("background-color"));
  } else {
   setIsHighlight(false);
  }

  if (!updateAnchorFromNativeSelection()) {
   clearSelectionState();
   return;
  }

  const hasChanged =
   latestDraftRef.current.text !== nextDraft.text ||
   latestDraftRef.current.contextSentence !== nextDraft.contextSentence;

  if (hasChanged) {
   latestDraftRef.current = nextDraft;
   setDraftSelection(nextDraft);
   setIsViewportHidden(false);
   setShowNote(false);
   setNoteDraft("");
   setNoteSelectionKey("");
   setShowLinkSearch(false);
   setLinkSearchQuery("");
   setLinkSearchResults([]);
   setShowInlineNote(false);
   setInlineNoteDraft("");
  }
 }, [
  clearSelectionState,
  showNote,
  showLinkSearch,
  showInlineNote,
  updateAnchorFromNativeSelection,
 ]);

 useEffect(() => {
  return mergeRegister(
   editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
     updateSelectionState();
     return false;
    },
    COMMAND_PRIORITY_LOW,
   ),
   editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => updateSelectionState());
   }),
   // Ctrl+K / Cmd+K shortcut for "Link to note"
   editor.registerCommand(
    KEY_DOWN_COMMAND,
    (event: KeyboardEvent) => {
     if ((event.metaKey || event.ctrlKey) && event.key === "k") {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
       event.preventDefault();
       setShowLinkSearch(true);
       setShowNote(false);
       setShowInlineNote(false);
       requestAnimationFrame(() => {
        linkSearchInputRef.current?.focus();
       });
       return true;
      }
     }
     return false;
    },
    COMMAND_PRIORITY_CRITICAL,
   ),
  );
 }, [editor, updateSelectionState]);

 // Show the popup for ANY text selection (not only Chinese)
 const finalPopupOpen =
  hasAnchor &&
  !isViewportHidden &&
  !!selectedText &&
  draftSelection.text === selectedText &&
  draftSelection.contextSentence === contextSentence;

 const showChineseLookup = isChineseSelection && lookupEnabled;

 useEffect(() => {
  if (!finalPopupOpen) return;

  const hide = () => setIsViewportHidden(true);
  window.addEventListener("scroll", hide, { capture: true, passive: true });
  window.addEventListener("resize", hide);

  return () => {
   window.removeEventListener("scroll", hide, { capture: true });
   window.removeEventListener("resize", hide);
  };
 }, [finalPopupOpen]);

 const formatText = useCallback(
  (format: TextFormatType) => {
   editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  },
  [editor],
 );

 const toggleHighlight = useCallback(() => {
  editor.update(() => {
   const selection = $getSelection();
   if ($isRangeSelection(selection)) {
    $patchStyleText(selection, {
     "background-color": isHighlight ? null : "#fef08a",
    });
   }
  });
 }, [editor, isHighlight]);

 const clearFormatting = useCallback(() => {
  editor.update(() => {
   const selection = $getSelection();
   if (!$isRangeSelection(selection)) return;

   for (const node of selection.getNodes()) {
    if ($isTextNode(node)) {
     if (node.getFormat() !== 0) node.setFormat(0);
     if (node.getStyle()) node.setStyle("");
    }
   }
  });
 }, [editor]);

 const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);

  try {
   await saveSelection({
    personalNote: noteDraft || smartData?.personal_note || "",
    personalNoteMode: "important",
   });
   toast.success(
    smartMode === "sentence"
     ? "Đã lưu câu mẫu vào kho ôn tập"
     : `Đã lưu "${smartData?.entry.hanzi || detailTarget}" vào kho ôn tập`,
   );
  } catch (saveError) {
   toast.error(
    saveError instanceof Error ? saveError.message : "Không thể lưu selection",
   );
  }
 };

 const handleSpeak = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);

  const speechText = smartMode === "sentence" ? selectedText : detailTarget;
  if (!speechText) return;

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.lang = "zh-CN";
  utterance.rate = 0.88;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
 };

 const handleToggleNote = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);

  const nextOpen = !showNote;
  if (nextOpen && noteSelectionKey !== selectionKey) {
   setNoteDraft(smartData?.personal_note || "");
   setNoteSelectionKey(selectionKey);
  }

  setShowNote(nextOpen);

  if (nextOpen) {
   requestAnimationFrame(() => {
    noteTextareaRef.current?.focus();
   });
  }
 };

 const handleSaveNote = async (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);

  if (!smartData) return;

  try {
   await saveSelection({
    personalNote: noteDraft,
    personalNoteMode: "important",
   });
   toast.success("Đã lưu ghi chú nhanh");
   setShowNote(false);
  } catch (saveError) {
   toast.error(
    saveError instanceof Error ? saveError.message : "Không thể lưu ghi chú",
   );
  }
 };

 /* ── Link to note ── */
 const handleLinkSearch = useCallback(async (query: string) => {
  setLinkSearchQuery(query);
  if (!query.trim()) {
   setLinkSearchResults([]);
   return;
  }
  setIsSearching(true);
  try {
   const res = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`);
   if (res.ok) {
    const data = await res.json();
    setLinkSearchResults(data.notes || []);
   }
  } catch {
   // silent fail
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
    const linkNode = $createInternalLinkNode(
     noteItem.id,
     noteItem.title,
     linkText,
    );
    selection.insertNodes([linkNode]);
   });
   toast.success(`Đã liên kết đến "${noteItem.title}"`);
   setShowLinkSearch(false);
   setLinkSearchQuery("");
   setLinkSearchResults([]);
  },
  [editor],
 );

 const handleToggleLinkSearch = (
  event: React.MouseEvent<HTMLButtonElement>,
 ) => {
  preserveEditorSelection(event);
  const next = !showLinkSearch;
  setShowLinkSearch(next);
  setShowNote(false);
  setShowInlineNote(false);
  if (next) {
   requestAnimationFrame(() => {
    linkSearchInputRef.current?.focus();
   });
  }
 };

 /* ── Inline quick note ── */
 const handleToggleInlineNote = (
  event: React.MouseEvent<HTMLButtonElement>,
 ) => {
  preserveEditorSelection(event);
  const next = !showInlineNote;
  setShowInlineNote(next);
  setShowNote(false);
  setShowLinkSearch(false);
  if (next) {
   setInlineNoteDraft("");
   requestAnimationFrame(() => {
    inlineNoteTextareaRef.current?.focus();
   });
  }
 };

 const handleSaveInlineNote = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  if (!inlineNoteDraft.trim()) return;

  // Replace selected text with an InlineNoteNode (persists in document JSON)
  editor.update(() => {
   const selection = $getSelection();
   if (!$isRangeSelection(selection)) return;

   const text = selection.getTextContent();
   selection.removeText();
   const noteNode = $createInlineNoteNode(text, inlineNoteDraft.trim());
   selection.insertNodes([noteNode]);
  });

  toast.success("Đã lưu ghi chú nhanh");
  setShowInlineNote(false);
  setInlineNoteDraft("");
 };

 if (typeof window === "undefined" || !finalPopupOpen) {
  return null;
 }

 return (
  <Popover.Root
   open={finalPopupOpen}
   onOpenChange={(open) => {
    if (!open) {
     setIsViewportHidden(true);
     setShowNote(false);
     setShowLinkSearch(false);
     setShowInlineNote(false);
    }
   }}
   modal={false}
  >
   <Popover.Portal>
    <Popover.Positioner
     anchor={getAnchor}
     side="top"
     align="center"
     sideOffset={12}
     collisionPadding={12}
     positionMethod="fixed"
     style={{ zIndex: 9999 }}
    >
     <Popover.Popup
      initialFocus={false}
      finalFocus={false}
      onMouseDown={preserveEditorSelection}
      data-no-inspector
      style={{ maxWidth: "calc(100vw - 1rem)" }}
      className="relative w-auto min-w-75 max-w-md rounded-xl border border-border-default bg-bg-elevated shadow-theme-lg"
     >
      {showChineseLookup && (
       <div className="p-2 pb-1">
        {smartLoading ? (
         <div className="flex items-center justify-center gap-2 rounded-xl px-3 py-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span>Đang tra...</span>
         </div>
        ) : smartError ? (
         <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
         </div>
        ) : smartData ? (
         smartMode === "word" ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
           <div className="text-center">
            <p className="text-xl font-bold text-slate-900">
             {smartData.entry.hanzi}
            </p>
            {smartData.entry.pinyin && (
             <p className="mt-1 text-sm font-semibold text-indigo-600">
              {smartData.entry.pinyin}
             </p>
            )}
           </div>
           <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-border-default bg-bg-card px-3 py-2 text-text-primary shadow-theme-sm">
             <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Từ loại
             </p>
             <p className="mt-1 text-sm font-semibold text-slate-800">
              {smartData.definitions[0]?.pos ||
               smartData.entry.ai_analysis?.word_type ||
               "Chưa rõ"}
             </p>
            </div>
            <div className="rounded-xl border border-border-default bg-bg-card px-3 py-2 text-text-primary shadow-theme-sm">
             <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Pinyin
             </p>
             <p className="mt-1 text-sm font-semibold text-indigo-600">
              {smartData.entry.pinyin || "Chưa rõ"}
             </p>
            </div>
            <div className="rounded-xl border border-border-default bg-bg-card px-3 py-2 text-text-primary shadow-theme-sm">
             <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Nghĩa
             </p>
             <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800">
              {smartData.meaning_summary ||
               smartData.definitions[0]?.meaning ||
               smartData.definitions[0]?.text ||
               smartData.entry.meaning ||
               "Chưa có nghĩa"}
             </p>
            </div>
           </div>
           <div className="rounded-xl border border-border-default bg-bg-card px-3 py-3 text-center text-text-primary shadow-theme-sm">
            <p className="text-sm font-medium leading-6 text-slate-800">
             {smartData.meaning_summary ||
              smartData.definitions[0]?.meaning ||
              smartData.definitions[0]?.text ||
              smartData.entry.meaning ||
              "Chưa có nghĩa cho selection này"}
            </p>
            {smartData.definitions[1] && (
             <p className="mt-1 text-xs leading-5 text-slate-500">
              {smartData.definitions[1].meaning ||
               smartData.definitions[1].text}
             </p>
            )}
           </div>
          </div>
         ) : (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
           <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
            <p className="text-sm font-semibold leading-6 text-slate-900">
             {smartData.selection}
            </p>
            {smartData.entry.pinyin && (
             <p className="mt-1 text-xs text-gray-500">
              {smartData.entry.pinyin}
             </p>
            )}
           </div>

           <div className="space-y-1.5">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
             Dịch nghĩa
            </p>
            <div className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700">
             {smartData.translation || "Chưa có bản dịch cho câu này"}
            </div>
           </div>

           {smartData.grammar_points[0]?.explanation && (
            <div className="rounded-xl border border-border-default bg-bg-elevated px-3 py-2 text-sm leading-6 text-text-secondary shadow-theme-sm">
             {smartData.grammar_points[0].explanation}
            </div>
           )}
          </div>
         )
        ) : null}
       </div>
      )}

      <div className="border-t border-slate-200 bg-slate-50 p-2">
       <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
         {showChineseLookup && (
          <>
           <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 min-w-0 rounded-2xl -full px-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onMouseDown={preserveEditorSelection}
            onClick={handleSave}
            disabled={isSaving || !smartData || smartData.isSaved}
            title={smartData?.isSaved ? "Đã lưu" : "Lưu"}
           >
            {isSaving ? (
             <Loader2 className="h-4 w-4 animate-spin" />
            ) : smartData?.isSaved ? (
             <Check className="h-4 w-4 text-emerald-600" />
            ) : (
             <BookmarkPlus className="h-4 w-4" />
            )}
           </Button>
           <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 min-w-0 rounded-2xl -full px-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onMouseDown={preserveEditorSelection}
            onClick={handleSpeak}
            disabled={!detailTarget && !selectedText}
            title="Nghe"
           >
            <Volume2 className="h-4 w-4" />
           </Button>
           <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
             "h-8 w-8 min-w-0 rounded-2xl -full px-0 text-slate-500 hover:bg-amber-50 hover:text-amber-700",
             showNote && "bg-amber-100 text-amber-700",
            )}
            onMouseDown={preserveEditorSelection}
            onClick={handleToggleNote}
            title="Ghi chú important"
           >
            <NotebookPen className="h-4 w-4" />
           </Button>
           <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-2xl -full px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onMouseDown={preserveEditorSelection}
            onClick={(event) => {
             preserveEditorSelection(event);
             if (!detailTarget) return;
             openDetailDrawer({
              text: detailTarget,
              contextSentence,
              mode: smartMode,
             });
             setIsViewportHidden(true);
            }}
            disabled={!detailTarget && !selectedText}
            title="Mở chi tiết"
           >
            Chi tiết
            <ChevronRight className="h-4 w-4" />
           </Button>
          </>
         )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
         {/* ── Link to note + Quick note (always visible) ── */}
         <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
           "h-8 w-8 min-w-0 rounded-xl border border-transparent px-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900",
           showLinkSearch && "border-indigo-200 bg-indigo-50 text-indigo-600",
          )}
          onMouseDown={preserveEditorSelection}
          onClick={handleToggleLinkSearch}
          title="Liên kết ghi chú (Ctrl+K)"
         >
          <Link2 className="h-4 w-4" />
         </Button>
         <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
           "h-8 w-8 min-w-0 rounded-xl border border-transparent px-0 text-slate-500 hover:bg-amber-50 hover:text-amber-700",
           showInlineNote && "border-amber-200 bg-amber-50 text-amber-700",
          )}
          onMouseDown={preserveEditorSelection}
          onClick={handleToggleInlineNote}
          title="Ghi chú nhanh"
         >
          <StickyNote className="h-4 w-4" />
         </Button>
         <div className="mx-1 h-5 w-px bg-slate-200" />

         <FormatButton
          active={isBold}
          onClick={() => formatText("bold")}
          title="Bold"
         >
          <Bold className="h-4 w-4" />
         </FormatButton>
         <FormatButton
          active={isItalic}
          onClick={() => formatText("italic")}
          title="Italic"
         >
          <Italic className="h-4 w-4" />
         </FormatButton>
         <FormatButton
          active={isUnderline}
          onClick={() => formatText("underline")}
          title="Underline"
         >
          <Underline className="h-4 w-4" />
         </FormatButton>
         <FormatButton
          active={isStrikethrough}
          onClick={() => formatText("strikethrough")}
          title="Strikethrough"
         >
          <Strikethrough className="h-4 w-4" />
         </FormatButton>
         <FormatButton
          active={isSubscript}
          onClick={() => formatText("subscript")}
          title="Subscript"
         >
          <Subscript className="h-4 w-4" />
         </FormatButton>
         <FormatButton
          active={isSuperscript}
          onClick={() => formatText("superscript")}
          title="Superscript"
         >
          <Superscript className="h-4 w-4" />
         </FormatButton>
         <div className="mx-1 h-5 w-px bg-slate-200" />
         <FormatButton
          active={isHighlight}
          onClick={toggleHighlight}
          title="Highlight"
         >
          <Highlighter className="h-4 w-4" />
         </FormatButton>
         <FormatButton
          active={isCode}
          onClick={() => formatText("code")}
          title="Inline Code"
         >
          <Code className="h-4 w-4" />
         </FormatButton>
         <div className="mx-1 h-5 w-px bg-slate-200" />
         <FormatButton onClick={clearFormatting} title="Clear Formatting">
          <RemoveFormatting className="h-4 w-4" />
         </FormatButton>
        </div>
       </div>

       {showNote && (
        <div className="mt-2 overflow-hidden rounded-xl border border-yellow-100 bg-yellow-50 p-3 animate-in slide-in-from-top-1 duration-200">
         <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-2xl -full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
           Important
          </span>
          <Button
           variant="ghost"
           size="sm"
           className="h-8 min-w-0 rounded-xl px-2 text-amber-700 hover:bg-amber-100"
           onMouseDown={preserveEditorSelection}
           onClick={handleSaveNote}
           disabled={isSaving || !smartData}
          >
           <Save className="h-4 w-4" />
           Lưu note
          </Button>
         </div>
         <textarea
          ref={noteTextareaRef}
          value={noteDraft}
          onMouseDown={(event) => {
           event.preventDefault();
           event.stopPropagation();
           requestAnimationFrame(() => {
            noteTextareaRef.current?.focus();
           });
          }}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setNoteDraft(event.target.value)}
          className="min-h-23 w-full resize-y rounded-xl border border-yellow-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-amber-300"
          placeholder="Ghi chú nhanh..."
         />
        </div>
       )}

       {/* ── Link to Note search ── */}
       {showLinkSearch && (
        <div className="mt-2 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 animate-in slide-in-from-top-1 duration-200">
         <div className="mb-2 flex items-center gap-2">
          <Search className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">
           Liên kết ghi chú
          </span>
         </div>
         <input
          ref={linkSearchInputRef}
          type="text"
          value={linkSearchQuery}
          onMouseDown={(event) => {
           event.preventDefault();
           event.stopPropagation();
           requestAnimationFrame(() => {
            linkSearchInputRef.current?.focus();
           });
          }}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => handleLinkSearch(event.target.value)}
          onKeyDown={(event) => {
           if (event.key === "Escape") {
            setShowLinkSearch(false);
           }
           if (event.key === "Enter" && linkSearchResults.length > 0) {
            event.preventDefault();
            handleInsertNoteLink(linkSearchResults[0]);
           }
          }}
          placeholder="Tìm theo tiêu đề ghi chú..."
          className="w-full rounded-xl border border-border-default bg-bg-input px-3 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent-muted"
         />
         {isSearching && (
          <div className="mt-2 flex items-center gap-2 text-xs text-indigo-500">
           <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tìm...
          </div>
         )}
         {!isSearching && linkSearchResults.length > 0 && (
          <div className="mt-2 max-h-36 overflow-y-auto scrollbar-soft  space-y-0.5">
           {linkSearchResults.map((note) => (
            <button
             key={note.id}
             onMouseDown={preserveEditorSelection}
             onClick={(event) => {
              preserveEditorSelection(event);
              handleInsertNoteLink(note);
             }}
             className="w-full text-left rounded-2xl  px-3 py-1.5 text-sm hover:bg-indigo-100 transition-colors text-slate-700"
            >
             {note.title}
            </button>
           ))}
          </div>
         )}
         {!isSearching && linkSearchQuery && linkSearchResults.length === 0 && (
          <p className="mt-2 text-xs text-slate-400">
           Không tìm thấy ghi chú nào
          </p>
         )}
        </div>
       )}

       {/* ── Inline Quick Note ── */}
       {showInlineNote && (
        <div className="mt-2 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/50 p-3 animate-in slide-in-from-top-1 duration-200">
         <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-2xl -full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
           Ghi chú nhanh
          </span>
          <Button
           variant="ghost"
           size="sm"
           className="h-7 min-w-0 rounded-xl px-2 text-xs text-sky-700 hover:bg-sky-100"
           onMouseDown={preserveEditorSelection}
           onClick={handleSaveInlineNote}
          >
           <Save className="h-3.5 w-3.5" />
           Lưu
          </Button>
         </div>
         <textarea
          ref={inlineNoteTextareaRef}
          value={inlineNoteDraft}
          onMouseDown={(event) => {
           event.preventDefault();
           event.stopPropagation();
           requestAnimationFrame(() => {
            inlineNoteTextareaRef.current?.focus();
           });
          }}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setInlineNoteDraft(event.target.value)}
          className="min-h-16 w-full resize-y rounded-xl border border-sky-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-300"
          placeholder="Ghim ghi chú lại... (vd: tra thêm ví dụ, phát âm đặc biệt)"
         />
        </div>
       )}
      </div>
     </Popover.Popup>
    </Popover.Positioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
