"use client";

import type { LexicalEditor } from "lexical";
import {
 Bold,
 Code,
 Highlighter,
 Italic,
 Languages,
 RemoveFormatting,
 Strikethrough,
 Subscript,
 Superscript,
 Underline,
} from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Separator } from "@/components/ui/layout/separator";
import { Typography } from "@/components/ui/display/typography";
import { containsChinese } from "@/lib/text/chinese-utils";
import { applyPinyinToSelection } from "../utils/pinyin-editor-actions";
import { FormatButton } from "./FormatButton";
import { NoteLinkToggleButtons } from "./NoteLinkToggleButtons";
import { preserveEditorSelection } from "./preserve-editor-selection";
import type { useFloatingMenuFormatting } from "./useFloatingMenuFormatting";
import type { useFloatingMenuPanels } from "./useFloatingMenuPanels";

type FloatingMenuFormatting = ReturnType<typeof useFloatingMenuFormatting>;
type FloatingMenuPanels = ReturnType<typeof useFloatingMenuPanels>;

/** Pinyin ruby and inline text-format controls; panel toggles join it outside Chinese lookup. */
export function FloatingMenuFormatToolbar({
 editor,
 showPanelToggles,
 pinyinSourceText,
 formatting,
 linkSearch,
 inlineNote,
}: {
 editor: LexicalEditor;
 showPanelToggles: boolean;
 pinyinSourceText: string;
 formatting: FloatingMenuFormatting;
 linkSearch: FloatingMenuPanels["linkSearch"];
 inlineNote: FloatingMenuPanels["inlineNote"];
}) {
 const { formats, isPinyinActive, formatText, toggleHighlight, clearFormatting } = formatting;

 return (
  <div className="grid gap-1.5">
   <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-0.5">
    <div className="flex items-center gap-1">
     {showPanelToggles ? (
      <>
       <NoteLinkToggleButtons linkSearch={linkSearch} inlineNote={inlineNote} />
       <Separator orientation="vertical" className="h-5" />
      </>
     ) : null}

     <Button
      variant={isPinyinActive ? "active" : "ghost"}
      size="compact"
      disabled={!containsChinese(pinyinSourceText) && !isPinyinActive}
      onMouseDown={preserveEditorSelection}
      onClick={(event) => {
       preserveEditorSelection(event);
       applyPinyinToSelection(editor);
      }}
      aria-label="Pinyin (Ruby)"
      title={
       isPinyinActive
        ? "Gỡ bỏ Pinyin (Ruby)"
        : containsChinese(pinyinSourceText)
          ? "Gắn Pinyin (Ruby) cho chữ Hán"
          : "Chỉ áp dụng Pinyin cho chữ Hán"
      }
     >
      <Languages data-icon="inline-start" />
      <Typography variant="caption" weight="bold">
       Pinyin
      </Typography>
     </Button>
    </div>

    <div className="flex items-center gap-0.5">
     <FormatButton
      active={formats.isSubscript}
      onClick={() => formatText("subscript")}
      title="Subscript (x₂)"
     >
      <Subscript />
     </FormatButton>
     <FormatButton
      active={formats.isSuperscript}
      onClick={() => formatText("superscript")}
      title="Superscript (x²)"
     >
      <Superscript />
     </FormatButton>
    </div>
   </div>

   <div className="flex items-center justify-between gap-1 border-t border-border-default/40 pt-1.5 overflow-x-auto scrollbar-none">
    <div className="flex items-center gap-0.5">
     <FormatButton active={formats.isBold} onClick={() => formatText("bold")} title="Bold (Ctrl+B)">
      <Bold />
     </FormatButton>
     <FormatButton
      active={formats.isItalic}
      onClick={() => formatText("italic")}
      title="Italic (Ctrl+I)"
     >
      <Italic />
     </FormatButton>
     <FormatButton
      active={formats.isUnderline}
      onClick={() => formatText("underline")}
      title="Underline (Ctrl+U)"
     >
      <Underline />
     </FormatButton>
     <FormatButton
      active={formats.isStrikethrough}
      onClick={() => formatText("strikethrough")}
      title="Strikethrough"
     >
      <Strikethrough />
     </FormatButton>

     <Separator orientation="vertical" className="h-5" />

     <FormatButton active={formats.isHighlight} onClick={toggleHighlight} title="Highlight">
      <Highlighter />
     </FormatButton>
     <FormatButton active={formats.isCode} onClick={() => formatText("code")} title="Inline Code">
      <Code />
     </FormatButton>
    </div>

    <div className="flex items-center gap-0.5">
     <FormatButton onClick={clearFormatting} title="Clear Formatting">
      <RemoveFormatting />
     </FormatButton>
    </div>
   </div>
  </div>
 );
}
