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
 FORMAT_TEXT_COMMAND,
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
 Loader2,
 NotebookPen,
 RemoveFormatting,
 Save,
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
import { useVocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
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
    "h-8 w-8 min-w-0 rounded-md border border-transparent px-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900",
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
 const latestDraftRef = useRef<DraftSelection>({
  text: "",
  contextSentence: "",
 });
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
 } = useSmartSelectionInsights(selectedText, contextSentence);

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
   if (showNote && latestDraftRef.current.text) {
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
  }
 }, [clearSelectionState, showNote, updateAnchorFromNativeSelection]);

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
  );
 }, [editor, updateSelectionState]);

 const popupOpen =
  hasAnchor &&
  !isViewportHidden &&
  !!selectedText &&
  isChineseSelection &&
  draftSelection.text === selectedText &&
  draftSelection.contextSentence === contextSentence;

 useEffect(() => {
  if (!popupOpen) return;

  const hide = () => setIsViewportHidden(true);
  window.addEventListener("scroll", hide, { capture: true, passive: true });
  window.addEventListener("resize", hide);

  return () => {
   window.removeEventListener("scroll", hide, { capture: true });
   window.removeEventListener("resize", hide);
  };
 }, [popupOpen]);

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

 if (typeof window === "undefined" || !popupOpen) {
  return null;
 }

 return (
  <Popover.Root
   open={popupOpen}
   onOpenChange={(open) => {
    if (!open) {
     setIsViewportHidden(true);
     setShowNote(false);
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
      className="relative w-auto min-w-75 max-w-md rounded-lg border border-gray-200 bg-white shadow-xl"
     >
      {isChineseSelection && (
       <div className="p-2 pb-1">
        {smartLoading ? (
         <div className="flex items-center justify-center gap-2 rounded-md px-3 py-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span>Đang tra...</span>
         </div>
        ) : smartError ? (
         <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
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
            <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
             <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Từ loại
             </p>
             <p className="mt-1 text-sm font-semibold text-slate-800">
              {smartData.definitions[0]?.pos ||
               smartData.entry.ai_analysis?.word_type ||
               "Chưa rõ"}
             </p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
             <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Pinyin
             </p>
             <p className="mt-1 text-sm font-semibold text-indigo-600">
              {smartData.entry.pinyin || "Chưa rõ"}
             </p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
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
           <div className="rounded-xl border border-white/80 bg-white px-3 py-3 text-center shadow-sm">
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
           <div className="rounded-md bg-slate-50 px-3 py-2 text-center">
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
            <div className="rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700">
             {smartData.translation || "Chưa có bản dịch cho câu này"}
            </div>
           </div>

           {smartData.grammar_points[0]?.explanation && (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 shadow-sm">
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
         {isChineseSelection && (
          <>
           <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 min-w-0 rounded-full px-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
            className="h-8 w-8 min-w-0 rounded-full px-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
             "h-8 w-8 min-w-0 rounded-full px-0 text-slate-500 hover:bg-amber-50 hover:text-amber-700",
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
            className="h-8 rounded-full px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
        <div className="mt-2 overflow-hidden rounded-md border border-yellow-100 bg-yellow-50 p-3 animate-in slide-in-from-top-1 duration-200">
         <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
           Important
          </span>
          <Button
           variant="ghost"
           size="sm"
           className="h-8 min-w-0 rounded-md px-2 text-amber-700 hover:bg-amber-100"
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
          className="min-h-23 w-full resize-y rounded-md border border-yellow-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-amber-300"
          placeholder="Ghi chú nhanh..."
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
