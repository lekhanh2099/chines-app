/**
 * FloatingToolbarPlugin — Unified "Smart Pill" floating toolbar.
 *
 * Single toolbar above selection with two tiers:
 *  - Tier 1 (Chinese only): Vocab lookup — pinyin + meaning + Save/Detail
 *  - Tier 2 (always): Formatting — B/I/U/S/Sub/Sup | Highlight/Code | Clear
 *
 * Inspired by Notion / iPhone Dynamic Island — one compact pill, no extra popups.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
 $getSelection,
 $isRangeSelection,
 $isTextNode,
 FORMAT_TEXT_COMMAND,
 SELECTION_CHANGE_COMMAND,
 COMMAND_PRIORITY_LOW,
 type TextFormatType,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $patchStyleText } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
 Bold,
 Italic,
 Underline,
 Strikethrough,
 Subscript,
 Superscript,
 Highlighter,
 Code,
 RemoveFormatting,
 Plus,
 Check,
 Loader2,
 BookOpen,
 Volume2,
} from "lucide-react";
import { containsChinese, extractChinese } from "@/lib/chinese-utils";
import { useQuickLookup } from "@/hooks/useQuickLookup";
import { useInspectorStore } from "@/stores/inspector-store";

const pf = (e: React.MouseEvent) => e.preventDefault();

/* ── Save helper ── */
async function saveVocab(hanzi: string, pinyin: string, meaning: string) {
 const res = await fetch("/api/vocab/inspect", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ hanzi, pinyin, meaning }),
 });
 if (!res.ok) throw new Error("Save failed");
 return res.json();
}

/* ── Unified Toolbar ── */
function FloatingToolbar({
 editor,
}: {
 editor: ReturnType<typeof useLexicalComposerContext>[0];
}) {
 const toolbarRef = useRef<HTMLDivElement>(null);
 const [isVisible, setIsVisible] = useState(false);
 const [pos, setPos] = useState({ top: 0, left: 0 });
 const [selectedText, setSelectedText] = useState("");

 // Format states
 const [isBold, setIsBold] = useState(false);
 const [isItalic, setIsItalic] = useState(false);
 const [isUnderline, setIsUnderline] = useState(false);
 const [isStrikethrough, setIsStrikethrough] = useState(false);
 const [isSubscript, setIsSubscript] = useState(false);
 const [isSuperscript, setIsSuperscript] = useState(false);
 const [isCode, setIsCode] = useState(false);
 const [isHighlight, setIsHighlight] = useState(false);

 // Vocab states
 const isChinese = containsChinese(selectedText);
 const chinese = isChinese ? extractChinese(selectedText) : "";
 const { data: lookupData, isLoading: lookupLoading } = useQuickLookup(chinese);
 const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
  "idle",
 );
 const openInspector = useInspectorStore((s) => s.openInspector);

 // Reset save state on selection change
 useEffect(() => {
  setSaveState("idle");
 }, [chinese]);

 // Auto-mark saved if already in DB
 useEffect(() => {
  if (lookupData?.isSaved) setSaveState("saved");
 }, [lookupData?.isSaved]);

 const updatePosition = useCallback(() => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
   setIsVisible(false);
   return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
   setIsVisible(false);
   return;
  }

  const toolbar = toolbarRef.current;
  const toolbarWidth = toolbar?.offsetWidth || 380;
  const toolbarHeight = toolbar?.offsetHeight || 80;
  const gap = 10;

  let top = rect.top - toolbarHeight - gap + window.scrollY;
  let left = rect.left + rect.width / 2 - toolbarWidth / 2 + window.scrollX;

  // Keep within viewport
  left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));
  if (top < window.scrollY + 8) {
   top = rect.bottom + gap + window.scrollY;
  }

  setPos({ top, left });
  setIsVisible(true);
 }, []);

 const $updateState = useCallback(() => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) {
   setIsVisible(false);
   setSelectedText("");
   return;
  }

  const text = selection.getTextContent();
  if (!text.trim()) {
   setIsVisible(false);
   setSelectedText("");
   return;
  }

  setSelectedText(text.trim());

  setIsBold(selection.hasFormat("bold"));
  setIsItalic(selection.hasFormat("italic"));
  setIsUnderline(selection.hasFormat("underline"));
  setIsStrikethrough(selection.hasFormat("strikethrough"));
  setIsSubscript(selection.hasFormat("subscript"));
  setIsSuperscript(selection.hasFormat("superscript"));
  setIsCode(selection.hasFormat("code"));

  const anchor = selection.anchor.getNode();
  if ($isTextNode(anchor)) {
   const style = anchor.getStyle();
   setIsHighlight(style.includes("background-color"));
  } else {
   setIsHighlight(false);
  }

  requestAnimationFrame(() => {
   updatePosition();
   // Re-position after render so actual height is measured
   requestAnimationFrame(updatePosition);
  });
 }, [updatePosition]);

 useEffect(() => {
  return mergeRegister(
   editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
     $updateState();
     return false;
    },
    COMMAND_PRIORITY_LOW,
   ),
   editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => $updateState());
   }),
  );
 }, [editor, $updateState]);

 // Hide on scroll/resize
 useEffect(() => {
  if (!isVisible) return;
  const hide = () => setIsVisible(false);
  window.addEventListener("scroll", hide, { capture: true, passive: true });
  window.addEventListener("resize", hide);
  return () => {
   window.removeEventListener("scroll", hide, { capture: true });
   window.removeEventListener("resize", hide);
  };
 }, [isVisible]);

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
   const nodes = selection.getNodes();
   for (const node of nodes) {
    if ($isTextNode(node)) {
     if (node.getFormat() !== 0) node.setFormat(0);
     if (node.getStyle()) node.setStyle("");
    }
   }
  });
 }, [editor]);

 const handleSave = async () => {
  if (!lookupData?.data || saveState === "saving" || saveState === "saved")
   return;
  setSaveState("saving");
  try {
   await saveVocab(
    lookupData.data.hanzi,
    lookupData.data.pinyin,
    lookupData.data.meaning,
   );
   setSaveState("saved");
  } catch {
   setSaveState("idle");
  }
 };

 const handleDetail = () => {
  if (chinese) openInspector(chinese);
 };

 const handleSpeak = () => {
  if (!chinese) return;
  const utterance = new SpeechSynthesisUtterance(chinese);
  utterance.lang = "zh-CN";
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
 };

 if (!isVisible) return null;

 return createPortal(
  <div
   ref={toolbarRef}
   className="ft-pill"
   data-no-inspector
   style={{ top: pos.top, left: pos.left }}
   onMouseDown={pf}
  >
   {/* ── TIER 1: Vocab lookup (Chinese only) ── */}
   {isChinese && (
    <div className="ft-vocab-tier" onMouseDown={pf}>
     {lookupLoading ? (
      <div className="ft-vocab-loading">
       <Loader2 className="ft-spinner" />
       <span>Looking up…</span>
      </div>
     ) : lookupData ? (
      <>
       {/* Pinyin + Meaning (text info) */}
       <div className="ft-vocab-info">
        <span className="ft-pinyin">{lookupData.data.pinyin}</span>
        {lookupData.data.meaning ? (
         <span className="ft-meaning">{lookupData.data.meaning}</span>
        ) : (
         <span className="ft-meaning ft-meaning--empty">No meaning</span>
        )}
       </div>

       {/* Action buttons: Lưu + Tra + TTS */}
       <div className="ft-vocab-actions">
        {saveState !== "saved" && (
         <button
          type="button"
          className="ft-action-btn ft-action-save"
          onClick={handleSave}
          disabled={saveState === "saving"}
          title="Lưu từ vựng"
         >
          {saveState === "saving" ? (
           <Loader2 className="w-3.5 h-3.5 ft-spinner" />
          ) : (
           <Plus className="w-3.5 h-3.5" />
          )}
          <span>{saveState === "saving" ? "…" : "Lưu"}</span>
         </button>
        )}
        <button
         type="button"
         className="ft-action-btn ft-action-detail"
         onClick={handleDetail}
         title="Tra chi tiết"
        >
         <BookOpen className="w-3.5 h-3.5" />
         <span>Tra</span>
        </button>
        <button
         type="button"
         className="ft-action-btn ft-action-speak"
         onClick={handleSpeak}
         title="Phát âm"
        >
         <Volume2 className="w-3.5 h-3.5" />
        </button>
       </div>
      </>
     ) : null}
    </div>
   )}

   {/* ── TIER 2: Format tools (always) ── */}
   <div className="ft-format-tier">
    <FTButton active={isBold} onClick={() => formatText("bold")} title="Bold">
     <Bold className="w-4 h-4" />
    </FTButton>
    <FTButton
     active={isItalic}
     onClick={() => formatText("italic")}
     title="Italic"
    >
     <Italic className="w-4 h-4" />
    </FTButton>
    <FTButton
     active={isUnderline}
     onClick={() => formatText("underline")}
     title="Underline"
    >
     <Underline className="w-4 h-4" />
    </FTButton>
    <FTButton
     active={isStrikethrough}
     onClick={() => formatText("strikethrough")}
     title="Strikethrough"
    >
     <Strikethrough className="w-4 h-4" />
    </FTButton>
    <FTButton
     active={isSubscript}
     onClick={() => formatText("subscript")}
     title="Subscript"
    >
     <Subscript className="w-4 h-4" />
    </FTButton>
    <FTButton
     active={isSuperscript}
     onClick={() => formatText("superscript")}
     title="Superscript"
    >
     <Superscript className="w-4 h-4" />
    </FTButton>
    <div className="ft-divider" />
    <FTButton active={isHighlight} onClick={toggleHighlight} title="Highlight">
     <Highlighter className="w-4 h-4" />
    </FTButton>
    <FTButton
     active={isCode}
     onClick={() => formatText("code")}
     title="Inline Code"
    >
     <Code className="w-4 h-4" />
    </FTButton>
    <div className="ft-divider" />
    <FTButton onClick={clearFormatting} title="Clear Formatting">
     <RemoveFormatting className="w-4 h-4" />
    </FTButton>
   </div>
  </div>,
  document.body,
 );
}

/* ── Format button ── */
function FTButton({
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
  <button
   type="button"
   onMouseDown={pf}
   onClick={onClick}
   title={title}
   aria-label={title}
   className={`ft-btn ${active ? "active" : ""}`}
  >
   {children}
  </button>
 );
}

/* ── Plugin export ── */
export default function FloatingToolbarPlugin() {
 const [editor] = useLexicalComposerContext();
 const [mounted] = useState(() => typeof window !== "undefined");

 if (!mounted) return null;

 return <FloatingToolbar editor={editor} />;
}
