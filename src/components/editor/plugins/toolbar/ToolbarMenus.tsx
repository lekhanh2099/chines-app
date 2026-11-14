"use client";

import { useState } from "react";
import type { ElementFormatType, LexicalEditor } from "lexical";
import {
 AlignCenter,
 AlignJustify,
 AlignLeft,
 AlignRight,
 ChevronDown,
 Eye,
 EyeOff,
 Indent,
 Languages,
 List,
 ListChecks,
 ListOrdered,
 Outdent,
 Sparkles,
 Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Separator } from "@/components/ui/layout/separator";
import {
 autoDetectPinyinInDocument,
 removeAllPinyinFromDocument,
 toggleGlobalPinyinVisibility,
} from "../../utils/pinyin-editor-actions";
import { pf } from "./ToolbarControls";

/* ── Pinyin Dropdown ── */

export function PinyinToolbarDropdown({
 editor,
 isEditable,
}: {
 editor: LexicalEditor;
 isEditable: boolean;
}) {
 const [isPinyinVisible, setIsPinyinVisible] = useState(true);

 const handleAutoDetect = () => {
  autoDetectPinyinInDocument(editor);
 };

 const handleToggleVisibility = () => {
  const visible = toggleGlobalPinyinVisibility(editor);
  setIsPinyinVisible(visible);
 };

 const handleRemoveAll = () => {
  removeAllPinyinFromDocument(editor);
 };

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     disabled={!isEditable}
     onMouseDown={pf}
     variant="ghost"
     size="toolbar"
     title="Công cụ Pinyin (nhận diện & gắn phiên âm cho tiếng Trung)"
     aria-label="Công cụ Pinyin"
    >
     <Languages data-icon="inline-start" />
     Pinyin
     <ChevronDown data-icon="inline-end" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start">
    <DropdownMenuItem onSelect={handleAutoDetect}>
     <Sparkles />
     Tự động tạo Pinyin (chỉ tiếng Trung)
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={handleToggleVisibility}>
     {isPinyinVisible ? <EyeOff /> : <Eye />}
     {isPinyinVisible ? "Ẩn Pinyin toàn bài" : "Hiện Pinyin toàn bài"}
    </DropdownMenuItem>
    <Separator />
    <DropdownMenuItem tone="destructive" onSelect={handleRemoveAll}>
     <Trash2 />
     Gỡ bỏ toàn bộ Pinyin
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}

/* ── Align Dropdown ── */

export function AlignDropdown({
 format,
 isEditable,
 onFormat,
 onIndent,
 onOutdent,
}: {
 format: ElementFormatType;
 isEditable: boolean;
 onFormat: (type: ElementFormatType) => void;
 onIndent: () => void;
 onOutdent: () => void;
}) {
 const formatIcon =
  format === "center" ? (
   <AlignCenter />
  ) : format === "right" ? (
   <AlignRight />
  ) : format === "justify" ? (
   <AlignJustify />
  ) : (
   <AlignLeft />
  );

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     disabled={!isEditable}
     onMouseDown={pf}
     variant="ghost"
     size="icon-toolbar"
     title="Căn lề và thụt dòng"
     aria-label="Căn lề và thụt dòng"
    >
     {formatIcon}
     <ChevronDown data-icon="inline-end" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start">
    <DropdownMenuItem
     tone={format === "left" ? "accent" : "default"}
     onSelect={() => onFormat("left")}
    >
     <AlignLeft />
     Căn trái
    </DropdownMenuItem>
    <DropdownMenuItem
     tone={format === "center" ? "accent" : "default"}
     onSelect={() => onFormat("center")}
    >
     <AlignCenter />
     Căn giữa
    </DropdownMenuItem>
    <DropdownMenuItem
     tone={format === "right" ? "accent" : "default"}
     onSelect={() => onFormat("right")}
    >
     <AlignRight />
     Căn phải
    </DropdownMenuItem>
    <DropdownMenuItem
     tone={format === "justify" ? "accent" : "default"}
     onSelect={() => onFormat("justify")}
    >
     <AlignJustify />
     Căn đều hai bên
    </DropdownMenuItem>
    <Separator />
    <DropdownMenuItem onSelect={onOutdent}>
     <Outdent />
     Giảm thụt lề
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={onIndent}>
     <Indent />
     Tăng thụt lề
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}

/* ── List Dropdown ── */

export function ListDropdown({
 blockType,
 isEditable,
 onSelect,
}: {
 blockType: string;
 isEditable: boolean;
 onSelect: (type: "bullet" | "number" | "check") => void;
}) {
 const isList = blockType === "bullet" || blockType === "number" || blockType === "check";
 const listIcon =
  blockType === "number" ? <ListOrdered /> : blockType === "check" ? <ListChecks /> : <List />;

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     disabled={!isEditable}
     onMouseDown={pf}
     variant={isList ? "active" : "ghost"}
     size="icon-toolbar"
     title="Danh sách"
     aria-label="Danh sách"
    >
     {listIcon}
     <ChevronDown data-icon="inline-end" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start">
    <DropdownMenuItem
     tone={blockType === "bullet" ? "accent" : "default"}
     onSelect={() => onSelect("bullet")}
    >
     <List />
     Danh sách dấu đầu dòng
    </DropdownMenuItem>
    <DropdownMenuItem
     tone={blockType === "number" ? "accent" : "default"}
     onSelect={() => onSelect("number")}
    >
     <ListOrdered />
     Danh sách số thứ tự
    </DropdownMenuItem>
    <DropdownMenuItem
     tone={blockType === "check" ? "accent" : "default"}
     onSelect={() => onSelect("check")}
    >
     <ListChecks />
     Danh sách kiểm tra (Checklist)
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
