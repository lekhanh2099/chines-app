"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
 $getSelection,
 $isRangeSelection,
 $isTextNode,
 COMMAND_PRIORITY_CRITICAL,
 COMMAND_PRIORITY_LOW,
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
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { BasePopover as Popover, BasePopoverPositioner } from "@/components/ui/base-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useDebounce } from "@/hooks/useDebounce";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { useTTS } from "@/hooks/useTTS";
import { extractChinese } from "@/lib/chinese-utils";
import type { NoteListItem } from "@/services/notes.service";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { vocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import { $createInternalLinkNode } from "./nodes/InternalLinkNode";
import { $createInlineNoteNode } from "./nodes/InlineNoteNode";
import { FONT_FAMILIES, QUICK_HANZI_FONT_FAMILIES } from "./toolbar-options";

type SelectionAnchor = {
 getBoundingClientRect: () => DOMRect;
 contextElement?: Element;
};

type DraftSelection = {
 text: string;
 contextSentence: string;
};

const DEBOUNCE_DELAY = 500;
const DEFAULT_FONT_VALUE = "__default__";
const EDITOR_HIGHLIGHT_COLOR = "var(--warning-subtle)";

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
  if (rect.width === 0 && rect.height === 0 && !fallbackRect) {
   selectionAnchorRef.current = null;
   setHasAnchor(false);
   return false;
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
   if ((showNote || showLinkSearch || showInlineNote) && latestDraftRef.current.text) return;
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
  }
 }, [
  clearSelectionState,
  showInlineNote,
  showLinkSearch,
  showNote,
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

 const finalPopupOpen =
  hasAnchor &&
  !isViewportHidden &&
  Boolean(selectedText) &&
  draftSelection.text === selectedText &&
  draftSelection.contextSentence === contextSentence;
 const showChineseLookup = isChineseSelection && lookupEnabled;

 useEffect(() => {
  if (!finalPopupOpen) return;
  const hide = () => setIsViewportHidden(true);
  window.addEventListener("resize", hide);
  return () => window.removeEventListener("resize", hide);
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
    if ($isRangeSelection(selection)) $patchStyleText(selection, styles);
   });
  },
  [editor],
 );

 const applyFontFamily = useCallback(
  (value: string) => {
   applyInlineStyle({ "font-family": value || null });
   setFontFamily(value);
  },
  [applyInlineStyle],
 );

 const toggleHighlight = useCallback(() => {
  applyInlineStyle({
   "background-color": isHighlight ? null : EDITOR_HIGHLIGHT_COLOR,
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
  setShowLinkSearch(false);
  setShowInlineNote(false);

  if (nextOpen) {
   requestAnimationFrame(() => noteTextareaRef.current?.focus());
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
  setShowNote(false);
  setShowInlineNote(false);
  if (next) requestAnimationFrame(() => linkSearchInputRef.current?.focus());
 };

 const handleToggleInlineNote = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  const next = !showInlineNote;
  setShowInlineNote(next);
  setShowNote(false);
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

 if (typeof window === "undefined" || !finalPopupOpen) return null;

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
      <div className="grid max-w-3xl gap-2">
       {showChineseLookup ? (
        <SmartLookupSummary
         smartLoading={smartLoading}
         smartError={smartError}
         error={error}
         smartData={smartData}
         smartMode={smartMode}
        />
       ) : null}

       <Card variant="subtle" padding="sm" className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
         <div className="flex flex-wrap items-center gap-1">
          {showChineseLookup ? (
           <>
            <Button
             variant="ghost"
             size="icon-toolbar"
             onMouseDown={preserveEditorSelection}
             onClick={handleSave}
             disabled={isSaving || !smartData || smartData.isSaved}
             aria-label={smartData?.isSaved ? "Đã lưu" : "Lưu vào kho ôn tập"}
             title={smartData?.isSaved ? "Đã lưu" : "Lưu"}
            >
             {isSaving ? (
              <Loader2 className="animate-spin" />
             ) : smartData?.isSaved ? (
              <Check className="text-success-text" />
             ) : (
              <BookmarkPlus />
             )}
            </Button>
            <Button
             variant="ghost"
             size="icon-toolbar"
             onMouseDown={preserveEditorSelection}
             onClick={handleSpeak}
             disabled={!detailTarget && !selectedText}
             aria-label="Nghe selection"
             title="Nghe"
            >
             <Volume2 />
            </Button>
            <Button
             variant={showNote ? "warning" : "ghost"}
             size="icon-toolbar"
             aria-pressed={showNote}
             onMouseDown={preserveEditorSelection}
             onClick={handleToggleNote}
             aria-label="Ghi chú important"
             title="Ghi chú important"
            >
             <NotebookPen />
            </Button>
            <Button
             variant="ghost"
             size="toolbar"
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
            >
             Chi tiết
             <ChevronRight data-icon="inline-end" />
            </Button>
           </>
          ) : null}
         </div>

         <div className="flex flex-wrap items-center justify-end gap-1">
          <Button
           variant={showLinkSearch ? "active" : "ghost"}
           size="icon-toolbar"
           aria-pressed={showLinkSearch}
           onMouseDown={preserveEditorSelection}
           onClick={handleToggleLinkSearch}
           aria-label="Liên kết ghi chú"
           title="Liên kết ghi chú (Ctrl+K)"
          >
           <Link2 />
          </Button>
          <Button
           variant={showInlineNote ? "warning" : "ghost"}
           size="icon-toolbar"
           aria-pressed={showInlineNote}
           onMouseDown={preserveEditorSelection}
           onClick={handleToggleInlineNote}
           aria-label="Ghi chú nhanh"
           title="Ghi chú nhanh"
          >
           <StickyNote />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <DropdownMenu>
           <DropdownMenuTrigger asChild>
            <Button
             variant={fontFamily ? "active" : "ghost"}
             size="compact"
             onMouseDown={preserveEditorSelection}
             title="Đổi font chữ"
            >
             <Type data-icon="inline-start" />
             <Typography variant="caption" weight="semibold" clamp="one" className="max-w-24">
              {FONT_FAMILIES.find(([value]) => value === fontFamily)?.[1] || "Font"}
             </Typography>
            </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" width="md">
            <DropdownMenuRadioGroup
             value={fontFamily || DEFAULT_FONT_VALUE}
             onValueChange={(value) => applyFontFamily(value === DEFAULT_FONT_VALUE ? "" : value)}
            >
             {FONT_FAMILIES.map(([value, label]) => (
              <DropdownMenuRadioItem
               key={value || DEFAULT_FONT_VALUE}
               value={value || DEFAULT_FONT_VALUE}
               style={value ? { fontFamily: value } : undefined}
              >
               {label}
              </DropdownMenuRadioItem>
             ))}
            </DropdownMenuRadioGroup>
           </DropdownMenuContent>
          </DropdownMenu>

          {QUICK_HANZI_FONT_FAMILIES.map(([value, label]) => (
           <Button
            key={`quick-${label}`}
            type="button"
            variant={fontFamily === value ? "active" : "surface"}
            size="compact"
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

          <Separator orientation="vertical" className="mx-1 h-5" />

          <FormatButton active={isBold} onClick={() => formatText("bold")} title="Bold">
           <Bold />
          </FormatButton>
          <FormatButton active={isItalic} onClick={() => formatText("italic")} title="Italic">
           <Italic />
          </FormatButton>
          <FormatButton
           active={isUnderline}
           onClick={() => formatText("underline")}
           title="Underline"
          >
           <Underline />
          </FormatButton>
          <FormatButton
           active={isStrikethrough}
           onClick={() => formatText("strikethrough")}
           title="Strikethrough"
          >
           <Strikethrough />
          </FormatButton>
          <FormatButton
           active={isSubscript}
           onClick={() => formatText("subscript")}
           title="Subscript"
          >
           <Subscript />
          </FormatButton>
          <FormatButton
           active={isSuperscript}
           onClick={() => formatText("superscript")}
           title="Superscript"
          >
           <Superscript />
          </FormatButton>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <FormatButton active={isHighlight} onClick={toggleHighlight} title="Highlight">
           <Highlighter />
          </FormatButton>
          <FormatButton active={isCode} onClick={() => formatText("code")} title="Inline Code">
           <Code />
          </FormatButton>
          <FormatButton onClick={clearFormatting} title="Clear Formatting">
           <RemoveFormatting />
          </FormatButton>
         </div>
        </div>

        {showNote ? (
         <Card variant="subtle" padding="sm" className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
           <Badge variant="warning">Important</Badge>
           <Button
            variant="ghost"
            size="toolbar"
            onMouseDown={preserveEditorSelection}
            onClick={handleSaveNote}
            disabled={isSaving || !smartData}
           >
            <Save data-icon="inline-start" />
            Lưu note
           </Button>
          </div>
          <Textarea
           ref={noteTextareaRef}
           value={noteDraft}
           onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            requestAnimationFrame(() => noteTextareaRef.current?.focus());
           }}
           onClick={(event) => event.stopPropagation()}
           onChange={(event) => setNoteDraft(event.target.value)}
           density="compact"
           surface="transparent"
           className="w-full"
           placeholder="Ghi chú nhanh..."
          />
         </Card>
        ) : null}

        {showLinkSearch ? (
         <Card variant="subtle" padding="sm" className="grid gap-2">
          <Typography
           variant="caption"
           tone="accent"
           weight="semibold"
           className="flex items-center gap-2"
          >
           <Search className="size-4" />
           Liên kết ghi chú
          </Typography>
          <Input
           ref={linkSearchInputRef}
           type="text"
           value={linkSearchQuery}
           onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            requestAnimationFrame(() => linkSearchInputRef.current?.focus());
           }}
           onClick={(event) => event.stopPropagation()}
           onChange={(event) => void handleLinkSearch(event.target.value)}
           onKeyDown={(event) => {
            if (event.key === "Escape") setShowLinkSearch(false);
            if (event.key === "Enter" && linkSearchResults.length > 0) {
             event.preventDefault();
             handleInsertNoteLink(linkSearchResults[0]);
            }
           }}
           placeholder="Tìm theo tiêu đề ghi chú..."
           surface="field"
           className="w-full"
          />
          {isSearching ? (
           <Typography variant="caption" tone="accent" className="flex items-center gap-2">
            <Loader2 className="animate-spin" />
            Đang tìm...
           </Typography>
          ) : null}
          {!isSearching && linkSearchResults.length > 0 ? (
           <div className="flex max-h-36 flex-col gap-0.5 overflow-y-auto scrollbar-soft">
            {linkSearchResults.map((note) => (
             <Button
              key={note.id}
              onMouseDown={preserveEditorSelection}
              onClick={(event) => {
               preserveEditorSelection(event);
               handleInsertNoteLink(note);
              }}
              variant="menu"
              size="menu"
              align="start"
              className="w-full"
             >
              {note.title}
             </Button>
            ))}
           </div>
          ) : null}
          {!isSearching && linkSearchQuery && linkSearchResults.length === 0 ? (
           <Typography as="p" variant="caption" tone="muted">
            Không tìm thấy ghi chú nào
           </Typography>
          ) : null}
         </Card>
        ) : null}

        {showInlineNote ? (
         <Card variant="subtle" padding="sm" className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
           <Badge variant="info">Ghi chú nhanh</Badge>
           <Button
            variant="ghost"
            size="toolbar"
            onMouseDown={preserveEditorSelection}
            onClick={handleSaveInlineNote}
            disabled={!inlineNoteDraft.trim()}
           >
            <Save data-icon="inline-start" />
            Lưu
           </Button>
          </div>
          <Textarea
           ref={inlineNoteTextareaRef}
           value={inlineNoteDraft}
           onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            requestAnimationFrame(() => inlineNoteTextareaRef.current?.focus());
           }}
           onClick={(event) => event.stopPropagation()}
           onChange={(event) => setInlineNoteDraft(event.target.value)}
           density="compact"
           surface="transparent"
           className="w-full"
           placeholder="Ghim ghi chú lại... (vd: tra thêm ví dụ, phát âm đặc biệt)"
          />
         </Card>
        ) : null}
       </Card>
      </div>
     </Popover.Popup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}

function SmartLookupSummary({
 smartLoading,
 smartError,
 error,
 smartData,
 smartMode,
}: {
 smartLoading: boolean;
 smartError: boolean;
 error: ReturnType<typeof useSmartSelectionInsights>["error"];
 smartData: ReturnType<typeof useSmartSelectionInsights>["data"];
 smartMode: ReturnType<typeof useSmartSelectionInsights>["mode"];
}) {
 if (smartLoading) {
  return (
   <Card variant="subtle" padding="md" className="flex items-center justify-center gap-2">
    <Loader2 className="animate-spin text-accent-text" />
    <Typography tone="muted">Đang tra...</Typography>
   </Card>
  );
 }

 if (smartError) {
  return (
   <Card variant="subtle" padding="md" role="alert">
    <Typography as="p" variant="bodySmall" tone="danger" weight="semibold">
     {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
    </Typography>
   </Card>
  );
 }

 if (!smartData) return null;

 if (smartMode === "word") {
  return (
   <Card variant="subtle" padding="md" className="grid gap-3">
    <div className="text-center">
     <Typography as="p" variant="sectionTitle" tone="default" weight="bold">
      {smartData.entry.hanzi}
     </Typography>
     {smartData.entry.pinyin ? (
      <Typography as="p" tone="accent" weight="semibold" className="mt-1">
       {smartData.entry.pinyin}
      </Typography>
     ) : null}
    </div>

    <Separator />

    <div className="grid gap-3 sm:grid-cols-3">
     <LookupFact
      label="Từ loại"
      value={smartData.definitions[0]?.pos || smartData.entry.ai_analysis?.word_type || "Chưa rõ"}
     />
     <LookupFact label="Pinyin" value={smartData.entry.pinyin || "Chưa rõ"} tone="accent" />
     <LookupFact
      label="Nghĩa"
      value={
       smartData.meaning_summary ||
       smartData.definitions[0]?.meaning ||
       smartData.definitions[0]?.text ||
       smartData.entry.meaning ||
       "Chưa có nghĩa"
      }
     />
    </div>

    <Separator />

    <div className="text-center">
     <Typography as="p" tone="secondary" weight="medium" leading="standard">
      {smartData.meaning_summary ||
       smartData.definitions[0]?.meaning ||
       smartData.definitions[0]?.text ||
       smartData.entry.meaning ||
       "Chưa có nghĩa cho selection này"}
     </Typography>
     {smartData.definitions[1] ? (
      <Typography as="p" variant="caption" tone="muted" leading="compact" className="mt-1">
       {smartData.definitions[1].meaning || smartData.definitions[1].text}
      </Typography>
     ) : null}
    </div>
   </Card>
  );
 }

 return (
  <Card variant="subtle" padding="md" className="grid gap-3">
   <div className="text-center">
    <Typography as="p" tone="default" weight="semibold" leading="standard">
     {smartData.selection}
    </Typography>
    {smartData.entry.pinyin ? (
     <Typography as="p" variant="caption" tone="muted" className="mt-1">
      {smartData.entry.pinyin}
     </Typography>
    ) : null}
   </div>

   <Separator />

   <LookupFact label="Dịch nghĩa" value={smartData.translation || "Chưa có bản dịch cho câu này"} />

   {smartData.grammar_points[0]?.explanation ? (
    <>
     <Separator />
     <LookupFact label="Ngữ pháp" value={smartData.grammar_points[0].explanation} />
    </>
   ) : null}
  </Card>
 );
}

function LookupFact({
 label,
 value,
 tone = "secondary",
}: {
 label: string;
 value: string;
 tone?: React.ComponentProps<typeof Typography>["tone"];
}) {
 return (
  <section className="grid gap-1">
   <Typography
    as="p"
    variant="overline"
    tone="muted"
    weight="semibold"
    scale="micro"
    tracking="loose"
    transform="uppercase"
   >
    {label}
   </Typography>
   <Typography as="p" tone={tone} weight="semibold" leading="standard">
    {value}
   </Typography>
  </section>
 );
}
