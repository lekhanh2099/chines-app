"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useState } from "react";
import Link from "next/link";
import {
 ExternalLink,
 Eye,
 MoreHorizontal,
 PanelLeft,
 PanelTopClose,
 PanelTopOpen,
 Pencil,
 Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import type { JsonObject } from "@/types/json";

import { LessonReadingPane } from "./LessonReadingPane";
import { NotePaneToggle } from "./NotePaneToggle";
import { PersonalNotePane } from "./PersonalNotePane";
import type { MobileNotePane } from "./types";

const defaultEmptyNoteContent: JsonObject = {
 root: {
  children: [],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "root",
  version: 1,
 },
};

export function LessonSplitNoteEditor({
 noteId,
 fillHeight = false,
 defaultReadingContent,
}: {
 noteId: string;
 fillHeight?: boolean;
 defaultReadingContent?: JsonObject;
}) {
 const [mobilePane, setMobilePane] = useState<MobileNotePane>("note");
 const [readOnly, setReadOnly] = useState(false);
 const [toolbarVisible, setToolbarVisible] = useState(true);
 const {
  note,
  isLoading,
  saveContent,
  saveReadingContent,
  isSaving,
  isReadingSaving,
  updateSplitView,
 } = useNoteDetail(noteId);

 if (isLoading) {
  return <LessonSplitNoteEditorSkeleton fillHeight={fillHeight} />;
 }

 if (!note) {
  return (
   <div className="rounded-xl border border-border-default bg-bg-subtle p-4 font-semibold text-text-muted">
    Không tìm thấy note đã gắn với bài này.
   </div>
  );
 }

 const readingContent = note.reading_content ?? defaultReadingContent ?? defaultEmptyNoteContent;
 const content = note.content;
 const splitEnabled = note.split_view_enabled ?? true;

 return (
  <div className={fillHeight ? "flex h-full min-h-0 min-w-0 flex-col gap-3" : "grid min-w-0 gap-3"}>
   <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
    <StudyInstructionText
     variant="caption"
     tone="muted"
     weight="bold"
     className="inline-flex items-center gap-1.5"
    >
     <Save className="h-3.5 w-3.5" />
     {isSaving || isReadingSaving ? "Đang lưu..." : "Autosave"}
    </StudyInstructionText>
    <div className="ml-auto flex min-w-0 items-center gap-2">
     <div className="hidden flex-wrap items-center justify-end gap-2 sm:flex sm:gap-3">
      <Button
       type="button"
       variant={readOnly ? "active" : "outline"}
       size="toolbar"
       aria-pressed={readOnly}
       onClick={() => setReadOnly((current) => !current)}
      >
       {readOnly ? <Eye /> : <Pencil />}
       {readOnly ? "Chỉ xem" : "Chỉnh sửa"}
      </Button>
      {!readOnly ? (
       <Button
        type="button"
        variant={toolbarVisible ? "active" : "outline"}
        size="toolbar"
        aria-pressed={toolbarVisible}
        onClick={() => setToolbarVisible((current) => !current)}
       >
        {toolbarVisible ? <PanelTopClose /> : <PanelTopOpen />}
        {toolbarVisible ? "Ẩn toolbar" : "Hiện toolbar"}
       </Button>
      ) : null}
      <Button
       type="button"
       variant={splitEnabled ? "active" : "outline"}
       size="toolbar"
       aria-pressed={splitEnabled}
       onClick={() => updateSplitView(!splitEnabled)}
      >
       {splitEnabled ? "Đóng Split" : "Mở Split"}
      </Button>
      <Button asChild variant="outline" size="toolbar">
       <Link href={`/notes/${note.id}`} prefetch={false}>
        <ExternalLink className="h-4 w-4" />
        Mở note
       </Link>
      </Button>
     </div>

     <div className="flex items-center gap-2 sm:hidden">
      <Button
       type="button"
       variant={readOnly ? "active" : "outline"}
       size="toolbar"
       aria-pressed={readOnly}
       onClick={() => setReadOnly((current) => !current)}
      >
       {readOnly ? <Eye /> : <Pencil />}
       {readOnly ? "Chỉ xem" : "Chỉnh sửa"}
      </Button>
      <DropdownMenu>
       <DropdownMenuTrigger asChild>
        <Button
         type="button"
         variant="outline"
         size="icon-toolbar"
         aria-label="Mở thêm tuỳ chọn ghi chú"
         title="Tuỳ chọn ghi chú"
        >
         <MoreHorizontal />
        </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" width="md">
        <DropdownMenuLabel>Tuỳ chọn ghi chú</DropdownMenuLabel>
        {!readOnly ? (
         <DropdownMenuCheckboxItem
          checked={toolbarVisible}
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={setToolbarVisible}
         >
          {toolbarVisible ? <PanelTopClose /> : <PanelTopOpen />}
          {toolbarVisible ? "Ẩn toolbar" : "Hiện toolbar"}
         </DropdownMenuCheckboxItem>
        ) : null}
        <DropdownMenuCheckboxItem
         checked={splitEnabled}
         onSelect={(event) => event.preventDefault()}
         onCheckedChange={updateSplitView}
        >
         <PanelLeft />
         {splitEnabled ? "Đóng Split" : "Mở Split"}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
         <Link href={`/notes/${note.id}`} prefetch={false}>
          <ExternalLink />
          Mở note đầy đủ
         </Link>
        </DropdownMenuItem>
       </DropdownMenuContent>
      </DropdownMenu>
     </div>
    </div>
   </div>

   {splitEnabled ? <NotePaneToggle activePane={mobilePane} onChange={setMobilePane} /> : null}

   {splitEnabled ? (
    <>
     <div
      className={
       fillHeight
        ? "note-editor-split-panel hidden min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-2"
        : "note-editor-split-panel hidden h-[calc(100dvh-17rem)] min-h-[36rem] max-h-[58rem] overflow-hidden lg:grid lg:grid-cols-2"
      }
     >
      <LessonReadingPane
       noteId={note.id}
       readingContent={readingContent}
       onSave={saveReadingContent}
       readOnly={readOnly}
       toolbarVisible={toolbarVisible}
       className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border-default"
      />
      <PersonalNotePane
       noteId={note.id}
       content={content}
       onSave={saveContent}
       readOnly={readOnly}
       toolbarVisible={toolbarVisible}
       className="flex h-full min-h-0 flex-col overflow-hidden"
      />
     </div>
     <div
      className={
       fillHeight
        ? "note-editor-split-panel min-h-0 flex-1 overflow-hidden lg:hidden"
        : "note-editor-split-panel h-[calc(100dvh-18rem)] min-h-[30rem] overflow-hidden lg:hidden"
      }
     >
      {mobilePane === "reading" ? (
       <LessonReadingPane
        noteId={note.id}
        readingContent={readingContent}
        onSave={saveReadingContent}
        readOnly={readOnly}
        toolbarVisible={toolbarVisible}
        className="flex h-full min-h-0 flex-col overflow-hidden"
       />
      ) : (
       <PersonalNotePane
        noteId={note.id}
        content={content}
        onSave={saveContent}
        readOnly={readOnly}
        toolbarVisible={toolbarVisible}
        className="flex h-full min-h-0 flex-col overflow-hidden"
       />
      )}
     </div>
    </>
   ) : (
    <div
     className={
      fillHeight
       ? "note-editor-scroll min-h-0 flex-1"
       : "note-editor-scroll h-[calc(100dvh-18rem)] min-h-[30rem] lg:h-[calc(100dvh-17rem)] lg:min-h-[36rem] lg:max-h-[58rem]"
     }
    >
     <PersonalNotePane
      noteId={note.id}
      content={content}
      onSave={saveContent}
      readOnly={readOnly}
      toolbarVisible={toolbarVisible}
      className="flex h-full min-h-0 flex-col overflow-hidden"
     />
    </div>
   )}
  </div>
 );
}

function LessonSplitNoteEditorSkeleton({ fillHeight }: { fillHeight: boolean }) {
 return (
  <div
   className={
    fillHeight ? "flex h-full min-h-0 animate-pulse flex-col gap-3" : "grid animate-pulse gap-3"
   }
   aria-busy="true"
   aria-live="polite"
  >
   <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
    <div className="h-4 w-20 rounded bg-bg-subtle" />
    <div className="ml-auto flex min-w-0 items-center gap-2">
     <div className="hidden flex-wrap justify-end gap-2 sm:flex sm:gap-3">
      <div className="h-9 w-28 rounded-lg bg-bg-subtle" />
      <div className="h-9 w-24 rounded-lg bg-bg-subtle" />
      <div className="h-9 w-24 rounded-lg bg-bg-subtle" />
      <div className="h-9 w-24 rounded-lg bg-bg-subtle" />
     </div>
     <div className="flex items-center gap-2 sm:hidden">
      <div className="h-9 w-28 rounded-lg bg-bg-subtle" />
      <div className="size-9 rounded-lg bg-bg-subtle" />
     </div>
    </div>
   </div>
   <div
    className={
     fillHeight
      ? "grid min-h-0 flex-1 overflow-hidden rounded-xl border border-border-default bg-bg-primary lg:grid-cols-2"
      : "grid h-[calc(100dvh-17rem)] min-h-[36rem] max-h-[58rem] overflow-hidden rounded-xl border border-border-default bg-bg-primary lg:grid-cols-2"
    }
   >
    {Array.from({ length: 2 }, (_, paneIndex) => (
     <div
      key={paneIndex}
      className={
       paneIndex === 0
        ? "grid content-start gap-4 border-border-default p-5 lg:first:border-r"
        : "hidden content-start gap-4 border-border-default p-5 lg:grid"
      }
     >
      <div className="h-5 w-28 rounded-md bg-bg-subtle" />
      <div className="h-8 w-56 max-w-full rounded-lg bg-bg-subtle" />
      {Array.from({ length: 7 }, (_, lineIndex) => (
       <div
        key={lineIndex}
        className={
         lineIndex % 3 === 2 ? "h-4 w-3/4 rounded bg-bg-subtle" : "h-4 rounded bg-bg-subtle"
        }
       />
      ))}
     </div>
    ))}
   </div>
   <span className="sr-only">Đang tải ghi chú của bài</span>
  </div>
 );
}
