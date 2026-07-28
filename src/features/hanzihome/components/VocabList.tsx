"use client";

import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import {
 Bookmark,
 CheckCircle2,
 ChevronDown,
 ChevronUp,
 Circle,
 Flame,
 Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HanziHomeVocabItem, LearningStatus } from "@/features/hanzihome/types";
import { learningStatusSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
import { getHanziTypographyStyle } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { cn } from "@/lib/utils";
import { z } from "zod";

const VocabStatusFilterSchema = z.union([z.literal("all"), learningStatusSchema]);
type VocabStatusFilter = z.infer<typeof VocabStatusFilterSchema>;

type VocabListProps = {
 words: HanziHomeVocabItem[];
 selectedWordId: z.infer<z.ZodNullable<z.ZodString>>;
 progress: Record<string, { status: LearningStatus }>;
 bookmarkedIds: string[];
 searchValue: string;
 statusFilter: VocabStatusFilter;
 compact?: boolean;
 actions?: ReactNode;
 onSearchChange: (value: string) => void;
 onStatusFilterChange: (value: VocabStatusFilter) => void;
 onSelectWord: (wordId: string) => void;
};

const normalPickerResizeBounds = {
 defaultHeight: 192,
 minHeight: 128,
 maxHeight: 520,
 step: 16,
};

const compactPickerResizeBounds = {
 defaultHeight: 128,
 minHeight: 96,
 maxHeight: 320,
 step: 16,
};

function clampValue(value: number, min: number, max: number) {
 return Math.min(max, Math.max(min, value));
}

export function VocabList({
 words,
 selectedWordId,
 progress,
 bookmarkedIds,
 searchValue,
 statusFilter,
 compact = false,
 actions,
 onSearchChange,
 onStatusFilterChange,
 onSelectWord,
}: VocabListProps) {
 const [isWordPickerOpen, setIsWordPickerOpen] = useState(!compact);
 const isCoarsePointer = useCoarsePointer();
 const resizeBounds = compact ? compactPickerResizeBounds : normalPickerResizeBounds;
 const [wordPickerHeight, setWordPickerHeight] = useState(resizeBounds.defaultHeight);
 const statusItems: Array<{
  value: VocabStatusFilter;
  label: string;
  icon: typeof Circle;
 }> = [
  { value: "all", label: "Tất cả", icon: Circle },
  { value: "learning", label: "Đang học", icon: Flame },
  { value: "hard", label: "Còn khó", icon: Flame },
  { value: "known", label: "Đã biết", icon: CheckCircle2 },
 ];
 const updateWordPickerHeight = (nextHeight: number) => {
  setWordPickerHeight(clampValue(nextHeight, resizeBounds.minHeight, resizeBounds.maxHeight));
 };
 const adjustWordPickerHeight = (delta: number) => {
  setWordPickerHeight((current) =>
   clampValue(current + delta, resizeBounds.minHeight, resizeBounds.maxHeight),
  );
 };
 const startWordPickerResize = (event: PointerEvent<HTMLButtonElement>) => {
  event.preventDefault();

  const startY = event.clientY;
  const startHeight = wordPickerHeight;

  const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
   updateWordPickerHeight(startHeight + moveEvent.clientY - startY);
  };
  const handlePointerUp = () => {
   window.removeEventListener("pointermove", handlePointerMove);
   window.removeEventListener("pointerup", handlePointerUp);
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
 };
 const handleResizeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
  if (event.key === "ArrowUp") {
   event.preventDefault();
   adjustWordPickerHeight(-resizeBounds.step);
   return;
  }
  if (event.key === "ArrowDown") {
   event.preventDefault();
   adjustWordPickerHeight(resizeBounds.step);
   return;
  }
  if (event.key === "Home") {
   event.preventDefault();
   updateWordPickerHeight(resizeBounds.minHeight);
   return;
  }
  if (event.key === "End") {
   event.preventDefault();
   updateWordPickerHeight(resizeBounds.maxHeight);
  }
 };

 return (
  <Card variant="section" padding="md">
   <div className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-0.5">
      <h2 className="text-base font-black text-text-primary">Từ vựng bài này</h2>
      <p className="text-sm font-medium text-text-muted">
       {words.length} từ phù hợp · Tab để chuyển nhanh
      </p>
     </div>

     <div className="flex flex-wrap items-center gap-1.5">
      {actions}
      {statusItems.map((item) => {
       const Icon = item.icon;
       const active = statusFilter === item.value;

       return (
        <Button
         key={item.value}
         type="button"
         variant={active ? "active" : "outline"}
         size="compact"
         aria-pressed={active}
         onClick={() => onStatusFilterChange(item.value)}
        >
         <Icon className="h-3.5 w-3.5" />
         {item.label}
        </Button>
       );
      })}
      <Button
       type="button"
       variant="ghost"
       size="compact"
       aria-expanded={isWordPickerOpen}
       onClick={() => setIsWordPickerOpen((current) => !current)}
      >
       {isWordPickerOpen ? (
        <ChevronUp className="h-3.5 w-3.5" />
       ) : (
        <ChevronDown className="h-3.5 w-3.5" />
       )}
       {isWordPickerOpen ? "Ẩn từ" : "Danh sách"}
      </Button>
     </div>
    </div>

    <div className="grid gap-2 lg:grid-cols-[minmax(18rem,28rem)_minmax(0,1fr)]">
     <label className="relative block">
      <span className="sr-only">Tìm từ vựng trong bài</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <Input
       value={searchValue}
       onChange={(event) => onSearchChange(event.target.value)}
       placeholder="Tìm Hán tự, pinyin, Hán Việt hoặc nghĩa"
       className="pl-9"
      />
     </label>

     <p className="hidden items-center text-sm leading-relaxed text-text-muted lg:flex">
      Chọn một từ để xem nghĩa, ví dụ và cách dùng. Shift+Tab quay lại từ trước.
     </p>
    </div>

    {words.length === 0 ? (
     <p className="rounded-xl bg-bg-subtle p-3  font-semibold text-text-muted">
      Không có từ phù hợp bộ lọc.
     </p>
    ) : isWordPickerOpen ? (
     <div className="grid gap-1">
      <div
       className={cn(
        "flex flex-wrap content-start gap-2 rounded-xl bg-bg-subtle p-2",
        isCoarsePointer ? "overflow-visible" : "overflow-y-auto scrollbar-soft",
       )}
       style={isCoarsePointer ? undefined : { height: wordPickerHeight }}
      >
       {words.map((word) => {
        const wordId = getVocabItemKey(word);
        const active = wordId === selectedWordId;
        const status = progress[wordId]?.status || "new";
        const bookmarked = bookmarkedIds.includes(wordId);

        return (
         <Button
          key={wordId}
          type="button"
          onClick={() => onSelectWord(wordId)}
          variant={active ? "active" : "outline"}
          className={cn(
           "h-auto min-h-11 gap-1.5 px-3 py-2",
           status === "hard" && !active && "border-warning/45",
           status === "known" && !active && "border-success/35",
          )}
         >
          <span
           style={getHanziTypographyStyle(
            {
             showPinyin: true,
             showMeaning: false,
             showAnswers: false,
             hanziFont: "system",
             hanziSize: "2xl",
             revealMode: "always",
            },
            { size: "xl" },
           )}
           lang="zh-CN"
          >
           {word.hanzi}
          </span>
          {bookmarked && <Bookmark className="h-3 w-3 fill-current" />}
         </Button>
        );
       })}
      </div>
      {!isCoarsePointer && (
       <button
        type="button"
        className="group flex h-3 cursor-row-resize items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        aria-label="Đổi chiều cao danh sách từ vựng"
        aria-orientation="horizontal"
        aria-valuemax={resizeBounds.maxHeight}
        aria-valuemin={resizeBounds.minHeight}
        aria-valuenow={wordPickerHeight}
        role="separator"
        onPointerDown={startWordPickerResize}
        onKeyDown={handleResizeKeyDown}
       >
        <span className="h-1 w-12 rounded-full bg-border-default transition-colors group-hover:bg-text-muted/40" />
       </button>
      )}
     </div>
    ) : (
     <p className="rounded-xl bg-bg-subtle px-3 py-2 text-sm font-medium text-text-muted">
      Danh sách từ đang thu gọn. Dùng search hoặc bấm “Danh sách” để mở lại.
     </p>
    )}
   </div>
  </Card>
 );
}
