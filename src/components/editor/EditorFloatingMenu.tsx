"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { BasePopover as Popover, BasePopoverPositioner } from "@/components/ui/base-popover";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
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
 Type,
 Underline,
 Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { useTTS } from "@/hooks/useTTS";
import { extractChinese } from "@/lib/chinese-utils";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { vocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import { usePathname } from "next/navigation";
import { $createInternalLinkNode } from "./nodes/InternalLinkNode";
import { $createInlineNoteNode } from "./nodes/InlineNoteNode";
import { FONT_FAMILIES, QUICK_HANZI_FONT_FAMILIES } from "./toolbar-options";
import type { NoteListItem } from "@/services/notes.service";
type SelectionAnchor = {
 getBoundingClientRect: () => DOMRect;
 contextElement?: Element;
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
   variant={active ? "active" : "ghost"}
   size="icon-toolbar"
   className="min-w-0"
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
 const { speak } = useTTS();
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
 const [fontFamily, setFontFamily] = useState("");
 const [showFontMenu, setShowFontMenu] = useState(false);
 const selectionAnchorRef = useRef<SelectionAnchor>(null);
 const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
 const linkSearchInputRef = useRef<HTMLInputElement>(null);
 const inlineNoteTextareaRef = useRef<HTMLTextAreaElement>(null);
 const latestDraftRef = useRef<DraftSelection>({
  text: "",
  contextSentence: "",
 });
 const pathname = usePathname();
 useSelector(dictionaryLookupStore, (state) => state.overrides);
 const lookupEnabled = dictionaryLookupStore.actions.isEnabled(pathname);
 const { hydrate: hydrateLookupSettings } = dictionaryLookupStore.actions;
 const { openDetailDrawer } = vocabDetailDrawerStore.actions;

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
 const detailTarget = smartData?.entry.hanzi || extractChinese(selectedText) || selectedText;

 useEffect(() => {
  hydrateLookupSettings();
 }, [hydrateLookupSettings]);

 const updateAnchorFromNativeSelection = useCallback(() => {
  const nativeSelection = window.getSelection();
  if (!nativeSelection || nativeSelection.isCollapsed || nativeSelection.rangeCount === 0) {
   selectionAnchorRef.current = null;
   setHasAnchor(false);
   return false;
  }

  const range = nativeSelection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const fallbackRect = Array.from(range.getClientRects()).find(
   (clientRect) => clientRect.width > 0 || clientRect.height > 0,
  );
  if (rect.width === 0 && rect.height === 0) {
   if (!fallbackRect) {
    selectionAnchorRef.current = null;
    setHasAnchor(false);
    return false;
   }
  }

  selectionAnchorRef.current = {
   getBoundingClientRect: () => {
    const nextRect = range.getBoundingClientRect();
    if (nextRect.width > 0 || nextRect.height > 0) return nextRect;

    const nextFallbackRect = Array.from(range.getClientRects()).find(
     (clientRect) => clientRect.width > 0 || clientRect.height > 0,
    );
    return nextFallbackRect ?? nextRect;
   },
   contextElement: editor.getRootElement() ?? undefined,
  };
  setHasAnchor(true);
  return true;
 }, [editor]);

 const getAnchor = useCallback(() => selectionAnchorRef.current, []);

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
  setShowFontMenu(false);
  setFontFamily("");
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
   if ((showNote || showLinkSearch || showInlineNote) && latestDraftRef.current.text) {
    return;
   }
   clearSelectionState();
   return;
  }

  const nextText = nativeSelection.toString().trim() || selection.getTextContent().trim();
  if (!nextText) {
   clearSelectionState();
   return;
  }

  const anchorNode = selection.anchor.getNode();
  const blockText = anchorNode.getTopLevelElement()?.getTextContent().replace(/\s+/g, " ").trim();
  const nextDraft = {
   text: nextText,
   contextSentence: blockText && blockText.includes(nextText) ? blockText : nextText,
  };

  setIsBold(selection.hasFormat("bold"));
  setIsItalic(selection.hasFormat("italic"));
  setIsUnderline(selection.hasFormat("underline"));
  setIsStrikethrough(selection.hasFormat("strikethrough"));
  setIsSubscript(selection.hasFormat("subscript"));
  setIsSuperscript(selection.hasFormat("superscript"));
  setIsCode(selection.hasFormat("code"));
  setFontFamily($getSelectionStyleValueForProperty(selection, "font-family", ""));

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
   setShowFontMenu(false);
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
  window.addEventListener("resize", hide);

  return () => {
   window.removeEventListener("resize", hide);
  };
 }, [finalPopupOpen]);

 const formatText = useCallback(
  (format: TextFormatType) => {
   editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  },
  [editor],
 );

 const applyInlineStyle = useCallback(
  (styles: Parameters<typeof $patchStyleText>[1]) => {
   editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
     $patchStyleText(selection, styles);
    }
   });
  },
  [editor],
 );

 const applyFontFamily = useCallback(
  (value: string) => {
   applyInlineStyle({ "font-family": value || null });
   setFontFamily(value);
   setShowFontMenu(false);
  },
  [applyInlineStyle],
 );

 const toggleHighlight = useCallback(() => {
  applyInlineStyle({
   "background-color": isHighlight ? null : "#fef08a",
  });
 }, [applyInlineStyle, isHighlight]);

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
   toast.error(saveError instanceof Error ? saveError.message : "Không thể lưu selection");
  }
 };

 const handleSpeak = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);

  const speechText = smartMode === "sentence" ? selectedText : detailTarget;
  if (!speechText) return;
  void speak(speechText);
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
   toast.error(saveError instanceof Error ? saveError.message : "Không thể lưu ghi chú");
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
  setShowNote(false);
  setShowInlineNote(false);
  if (next) {
   requestAnimationFrame(() => {
    linkSearchInputRef.current?.focus();
   });
  }
 };

 /* ── Inline quick note ── */
 const handleToggleInlineNote = (event: React.MouseEvent<HTMLButtonElement>) => {
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
     setShowFontMenu(false);
    }
   }}
   modal={false}
  >
   <Popover.Portal>
    <BasePopoverPositioner
     anchor={getAnchor}
     side="top"
     align="center"
     sideOffset={12}
     collisionPadding={12}
     positionMethod="fixed"
    >
     <Popover.Popup
      initialFocus={false}
      finalFocus={false}
      onMouseDown={preserveEditorSelection}
      data-no-inspector
      style={{ maxWidth: "calc(100vw - 1rem)" }}
     >
      {showChineseLookup && (
       <div className="p-2 pb-1">
        {smartLoading ? (
         <div className="flex items-center justify-center gap-2 rounded-xl px-3 py-4  text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent-text" />
          <span>Đang tra...</span>
         </div>
        ) : smartError ? (
         <div className="rounded-xl border border-danger/30 bg-danger-subtle px-3 py-2  text-danger-text">
          {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
         </div>
        ) : smartData ? (
         smartMode === "word" ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-bg-subtle px-4 py-3">
           <div className="text-center">
            <Typography as="p" variant="sectionTitle" tone="default" weight="bold">
             {smartData.entry.hanzi}
            </Typography>
            {smartData.entry.pinyin && (
             <Typography as="p" tone="accent" weight="semibold" className="mt-1">
              {smartData.entry.pinyin}
             </Typography>
            )}
           </div>
           <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-border-default bg-bg-card px-3 py-2 text-text-primary shadow-theme-sm">
             <Typography
              as="p"
              variant="overline"
              tone="muted"
              weight="semibold"
              scale="micro"
              tracking="loose"
              transform="uppercase"
             >
              Từ loại
             </Typography>
             <Typography as="p" tone="secondary" weight="semibold" className="mt-1">
              {smartData.definitions[0]?.pos || smartData.entry.ai_analysis?.word_type || "Chưa rõ"}
             </Typography>
            </div>
            <div className="rounded-xl border border-border-default bg-bg-card px-3 py-2 text-text-primary shadow-theme-sm">
             <Typography
              as="p"
              variant="overline"
              tone="muted"
              weight="semibold"
              scale="micro"
              tracking="loose"
              transform="uppercase"
             >
              Pinyin
             </Typography>
             <Typography as="p" tone="accent" weight="semibold" className="mt-1">
              {smartData.entry.pinyin || "Chưa rõ"}
             </Typography>
            </div>
            <div className="rounded-xl border border-border-default bg-bg-card px-3 py-2 text-text-primary shadow-theme-sm">
             <Typography
              as="p"
              variant="overline"
              tone="muted"
              weight="semibold"
              scale="micro"
              tracking="loose"
              transform="uppercase"
             >
              Nghĩa
             </Typography>
             <Typography as="p" tone="secondary" weight="semibold" clamp="two" className="mt-1">
              {smartData.meaning_summary ||
               smartData.definitions[0]?.meaning ||
               smartData.definitions[0]?.text ||
               smartData.entry.meaning ||
               "Chưa có nghĩa"}
             </Typography>
            </div>
           </div>
           <div className="rounded-xl border border-border-default bg-bg-card px-3 py-3 text-center text-text-primary shadow-theme-sm">
            <Typography as="p" tone="secondary" weight="medium" leading="standard">
             {smartData.meaning_summary ||
              smartData.definitions[0]?.meaning ||
              smartData.definitions[0]?.text ||
              smartData.entry.meaning ||
              "Chưa có nghĩa cho selection này"}
            </Typography>
            {smartData.definitions[1] && (
             <Typography as="p" variant="caption" tone="muted" leading="compact" className="mt-1">
              {smartData.definitions[1].meaning || smartData.definitions[1].text}
             </Typography>
            )}
           </div>
          </div>
         ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-border-default bg-bg-subtle px-4 py-3">
           <div className="rounded-xl bg-bg-subtle px-3 py-2 text-center">
            <Typography as="p" tone="default" weight="semibold" leading="standard">
             {smartData.selection}
            </Typography>
            {smartData.entry.pinyin && (
             <Typography as="p" variant="caption" tone="muted" className="mt-1">
              {smartData.entry.pinyin}
             </Typography>
            )}
           </div>

           <div className="flex flex-col gap-1.5">
            <Typography
             as="p"
             variant="overline"
             tone="muted"
             weight="semibold"
             align="center"
             scale="micro"
             tracking="extraLoose"
             transform="uppercase"
            >
             Dịch nghĩa
            </Typography>
            <div className="rounded-xl border border-border-default px-3 py-2  leading-6 text-text-secondary">
             {smartData.translation || "Chưa có bản dịch cho câu này"}
            </div>
           </div>

           {smartData.grammar_points[0]?.explanation && (
            <div className="rounded-xl border border-border-default bg-bg-elevated px-3 py-2  leading-6 text-text-secondary shadow-theme-sm">
             {smartData.grammar_points[0].explanation}
            </div>
           )}
          </div>
         )
        ) : null}
       </div>
      )}

      <div className="bg-bg-subtle p-2 rounded-2xl shadow-theme-sm">
       <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
         {showChineseLookup && (
          <>
           <Button
            variant="ghost"
            size="icon-sm"
            className="w-8 min-w-0 -full"
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
            className="w-8 min-w-0 -full"
            onMouseDown={preserveEditorSelection}
            onClick={handleSpeak}
            disabled={!detailTarget && !selectedText}
            title="Nghe"
           >
            <Volume2 className="h-4 w-4" />
           </Button>
           <Button
            variant={showNote ? "warning" : "ghost"}
            size="icon-toolbar"
            className="min-w-0"
            onMouseDown={preserveEditorSelection}
            onClick={handleToggleNote}
            title="Ghi chú important"
           >
            <NotebookPen className="h-4 w-4" />
           </Button>
           <Button
            variant="ghost"
            size="sm"
            className="-full"
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
          variant={showLinkSearch ? "active" : "ghost"}
          size="icon-toolbar"
          className="min-w-0"
          onMouseDown={preserveEditorSelection}
          onClick={handleToggleLinkSearch}
          title="Liên kết ghi chú (Ctrl+K)"
         >
          <Link2 className="h-4 w-4" />
         </Button>
         <Button
          variant="warning"
          size="icon-toolbar"
          className="min-w-0"
          aria-pressed={showInlineNote}
          onMouseDown={preserveEditorSelection}
          onClick={handleToggleInlineNote}
          title="Ghi chú nhanh"
         >
          <StickyNote className="h-4 w-4" />
         </Button>
         <div className="mx-1 h-5 w-px bg-border-default" />

         <div className="relative">
          <Button
           variant={fontFamily || showFontMenu ? "active" : "ghost"}
           size="compact"
           className="min-w-0"
           onMouseDown={preserveEditorSelection}
           onClick={(event) => {
            preserveEditorSelection(event);
            setShowFontMenu((open) => !open);
            setShowNote(false);
            setShowLinkSearch(false);
            setShowInlineNote(false);
           }}
           title="Đổi font chữ"
          >
           <Type className="h-4 w-4" />
           <Typography variant="caption" weight="semibold" clamp="one" className="max-w-24">
            {FONT_FAMILIES.find(([value]) => value === fontFamily)?.[1] || "Font"}
           </Typography>
          </Button>
          <div className="ml-1 inline-flex h-8 items-center gap-0.5 rounded-xl bg-bg-subtle/70 p-0.5">
           {QUICK_HANZI_FONT_FAMILIES.map(([value, label]) => (
            <Button
             key={`quick-${label}`}
             type="button"
             variant={fontFamily === value ? "active" : "surface"}
             size="compact"
             className="min-w-8"
             style={{ fontFamily: value }}
             onMouseDown={preserveEditorSelection}
             onClick={(event) => {
              preserveEditorSelection(event);
              applyFontFamily(value);
             }}
             title={label}
            >
             {label.replace("FZKTPY", "")}
            </Button>
           ))}
          </div>
          {showFontMenu ? (
           <div
            className="absolute right-0 top-[calc(100%+0.25rem)] z-10 max-h-64 min-w-44 overflow-y-auto rounded-xl border border-border-default bg-bg-elevated p-1 shadow"
            onMouseDown={preserveEditorSelection}
           >
            {FONT_FAMILIES.map(([value, label]) => (
             <Button
              key={value || "default"}
              type="button"
              variant={fontFamily === value ? "menuActive" : "menu"}
              size="compact"
              align="between"
              className="w-full"
              style={value ? { fontFamily: value } : undefined}
              onMouseDown={preserveEditorSelection}
              onClick={(event) => {
               preserveEditorSelection(event);
               applyFontFamily(value);
              }}
             >
              <span>{label}</span>
              {fontFamily === value ? <Check className="h-3.5 w-3.5" /> : null}
             </Button>
            ))}
           </div>
          ) : null}
         </div>
         <div className="mx-1 h-5 w-px bg-border-default" />

         <FormatButton active={isBold} onClick={() => formatText("bold")} title="Bold">
          <Bold className="h-4 w-4" />
         </FormatButton>
         <FormatButton active={isItalic} onClick={() => formatText("italic")} title="Italic">
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
         <div className="mx-1 h-5 w-px bg-border-default" />
         <FormatButton active={isHighlight} onClick={toggleHighlight} title="Highlight">
          <Highlighter className="h-4 w-4" />
         </FormatButton>
         <FormatButton active={isCode} onClick={() => formatText("code")} title="Inline Code">
          <Code className="h-4 w-4" />
         </FormatButton>
         <div className="mx-1 h-5 w-px bg-border-default" />
         <FormatButton onClick={clearFormatting} title="Clear Formatting">
          <RemoveFormatting className="h-4 w-4" />
         </FormatButton>
        </div>
       </div>

       {showNote && (
        <div className="mt-2 overflow-hidden rounded-xl border border-yellow-100 bg-yellow-50 p-3 animate-in slide-in-from-top-1 duration-200">
         <div className="mb-2 flex items-center justify-between gap-2">
          <Typography
           variant="overline"
           weight="semibold"
           tracking="wide"
           scale="micro"
           transform="uppercase"
           className="rounded-2xl -full bg-amber-100 px-2 py-0.5 text-amber-700"
          >
           Important
          </Typography>
          <Button
           variant="ghost"
           size="sm"
           className="min-w-0"
           onMouseDown={preserveEditorSelection}
           onClick={handleSaveNote}
           disabled={isSaving || !smartData}
          >
           <Save className="h-4 w-4" />
           Lưu note
          </Button>
         </div>
         <Textarea
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
          density="compact"
          surface="transparent"
          className="w-full"
          placeholder="Ghi chú nhanh..."
         />
        </div>
       )}

       {/* ── Link to Note search ── */}
       {showLinkSearch && (
        <div className="mt-2 overflow-hidden rounded-xl border border-primary/20 bg-accent-subtle p-3 animate-in slide-in-from-top-1 duration-200">
         <div className="mb-2 flex items-center gap-2">
          <Search className="h-4 w-4 text-accent-text" />
          <Typography variant="caption" tone="accent" weight="semibold">
           Liên kết ghi chú
          </Typography>
         </div>
         <Input
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
          surface="field"
          className="w-full"
         />
         {isSearching && (
          <div className="mt-2 flex items-center gap-2 text-xs text-accent-text">
           <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tìm...
          </div>
         )}
         {!isSearching && linkSearchResults.length > 0 && (
          <div className="mt-2 flex max-h-36 flex-col gap-0.5 overflow-y-auto scrollbar-soft">
           {linkSearchResults.map((note) => (
            <Button
             key={note.id}
             onMouseDown={preserveEditorSelection}
             onClick={(event) => {
              preserveEditorSelection(event);
              handleInsertNoteLink(note);
             }}
             variant="ghost"
             align="start"
             className="w-full"
            >
             {note.title}
            </Button>
           ))}
          </div>
         )}
         {!isSearching && linkSearchQuery && linkSearchResults.length === 0 && (
          <Typography as="p" variant="caption" tone="muted" className="mt-2">
           Không tìm thấy ghi chú nào
          </Typography>
         )}
        </div>
       )}

       {/* ── Inline Quick Note ── */}
       {showInlineNote && (
        <div className="mt-2 overflow-hidden rounded-xl border border-info/20 bg-info-subtle p-3 animate-in slide-in-from-top-1 duration-200">
         <div className="mb-2 flex items-center justify-between gap-2">
          <Typography
           variant="overline"
           tone="info"
           weight="semibold"
           tracking="wide"
           scale="micro"
           transform="uppercase"
           className="rounded-2xl -full bg-info-subtle px-2 py-0.5"
          >
           Ghi chú nhanh
          </Typography>
          <Button
           variant="ghost"
           size="sm"
           className="min-w-0"
           onMouseDown={preserveEditorSelection}
           onClick={handleSaveInlineNote}
          >
           <Save className="h-3.5 w-3.5" />
           Lưu
          </Button>
         </div>
         <Textarea
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
          density="compact"
          surface="transparent"
          className="w-full"
          placeholder="Ghim ghi chú lại... (vd: tra thêm ví dụ, phát âm đặc biệt)"
         />
        </div>
       )}
      </div>
     </Popover.Popup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
