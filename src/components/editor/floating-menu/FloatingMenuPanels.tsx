"use client";

import { Loader2, Save, Search } from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import { preserveEditorSelection } from "./preserve-editor-selection";
import type { useFloatingMenuPanels } from "./useFloatingMenuPanels";

type FloatingMenuPanels = ReturnType<typeof useFloatingMenuPanels>;

export function FloatingMenuNotePanel({
 note,
 isSaveDisabled,
 onSave,
}: {
 note: FloatingMenuPanels["note"];
 isSaveDisabled: boolean;
 onSave: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
 const { draft, setDraft, textareaRef } = note;

 return (
  <div className="grid gap-2 rounded-lg bg-bg-card/70 p-2 border border-border-default/40">
   <div className="flex items-center justify-between gap-2">
    <Badge variant="warning">Important</Badge>
    <Button
     variant="ghost"
     size="toolbar"
     onMouseDown={preserveEditorSelection}
     onClick={onSave}
     disabled={isSaveDisabled}
    >
     <Save data-icon="inline-start" />
     Lưu note
    </Button>
   </div>
   <Textarea
    ref={textareaRef}
    value={draft}
    onMouseDown={(event) => {
     event.preventDefault();
     event.stopPropagation();
     requestAnimationFrame(() => textareaRef.current?.focus());
    }}
    onClick={(event) => event.stopPropagation()}
    onChange={(event) => setDraft(event.target.value)}
    density="compact"
    surface="transparent"
    className="w-full"
    placeholder="Ghi chú nhanh..."
   />
  </div>
 );
}

export function FloatingMenuLinkSearchPanel({
 linkSearch,
}: {
 linkSearch: FloatingMenuPanels["linkSearch"];
}) {
 const { query, results, isSearching, inputRef, search, insertNoteLink, setIsOpen } = linkSearch;

 return (
  <div className="grid gap-2 rounded-lg bg-bg-card/70 p-2 border border-border-default/40">
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
    ref={inputRef}
    type="text"
    value={query}
    onMouseDown={(event) => {
     event.preventDefault();
     event.stopPropagation();
     requestAnimationFrame(() => inputRef.current?.focus());
    }}
    onClick={(event) => event.stopPropagation()}
    onChange={(event) => void search(event.target.value)}
    onKeyDown={(event) => {
     if (event.key === "Escape") setIsOpen(false);
     if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      insertNoteLink(results[0]);
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
   {!isSearching && results.length > 0 ? (
    <div className="flex max-h-36 flex-col gap-0.5 overflow-y-auto scrollbar-soft">
     {results.map((note) => (
      <Button
       key={note.id}
       onMouseDown={preserveEditorSelection}
       onClick={(event) => {
        preserveEditorSelection(event);
        insertNoteLink(note);
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
   {!isSearching && query && results.length === 0 ? (
    <Typography as="p" variant="caption" tone="muted">
     Không tìm thấy ghi chú nào
    </Typography>
   ) : null}
  </div>
 );
}

export function FloatingMenuInlineNotePanel({
 inlineNote,
}: {
 inlineNote: FloatingMenuPanels["inlineNote"];
}) {
 const { draft, setDraft, textareaRef, save } = inlineNote;

 return (
  <div className="grid gap-2 rounded-lg bg-bg-card/70 p-2 border border-border-default/40">
   <div className="flex items-center justify-between gap-2">
    <Badge variant="info">Ghi chú nhanh</Badge>
    <Button
     variant="ghost"
     size="toolbar"
     onMouseDown={preserveEditorSelection}
     onClick={save}
     disabled={!draft.trim()}
    >
     <Save data-icon="inline-start" />
     Lưu
    </Button>
   </div>
   <Textarea
    ref={textareaRef}
    value={draft}
    onMouseDown={(event) => {
     event.preventDefault();
     event.stopPropagation();
     requestAnimationFrame(() => textareaRef.current?.focus());
    }}
    onClick={(event) => event.stopPropagation()}
    onChange={(event) => setDraft(event.target.value)}
    density="compact"
    surface="transparent"
    className="w-full"
    placeholder="Ghim ghi chú lại... (vd: tra thêm ví dụ, phát âm đặc biệt)"
   />
  </div>
 );
}
