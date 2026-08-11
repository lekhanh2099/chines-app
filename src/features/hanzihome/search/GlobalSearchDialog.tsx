"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Input } from "@/components/ui/input";
import { useDeferredValue, useMemo, useState } from "react";
import { BookOpenCheck, LoaderCircle, Search } from "lucide-react";

import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { containsChinese } from "@/lib/chinese-utils";

import { searchHanziHomeIndex } from "./searchHanziHomeIndex";
import { SearchResultItem } from "./SearchResultItem";
import type { HanziHomeSearchIndexItem } from "./types";
import { useHanziHomeSearchIndex } from "./useHanziHomeSearchIndex";

type GlobalSearchDialogProps = {
 open: boolean;
 query: string;
 courseId?: string;
 lessonId?: string;
 onOpenChange: (open: boolean) => void;
 onQueryChange: (query: string) => void;
 onOpenResult: (item: HanziHomeSearchIndexItem) => void;
 onDirectLookup: (query: string) => void;
};

export function GlobalSearchDialog({
 open,
 query,
 courseId,
 lessonId,
 onOpenChange,
 onQueryChange,
 onOpenResult,
 onDirectLookup,
}: GlobalSearchDialogProps) {
 const [selectedIndex, setSelectedIndex] = useState(0);
 const deferredQuery = useDeferredValue(query);
 const searchIndex = useHanziHomeSearchIndex(open);
 const results = useMemo(
  () =>
   searchHanziHomeIndex(searchIndex.data ?? [], deferredQuery, {
    courseId,
    lessonId,
    includeGlobal: true,
    limit: 40,
   }),
  [courseId, deferredQuery, lessonId, searchIndex.data],
 );
 const visibleItems = useMemo(() => {
  if (deferredQuery.trim()) return results.map((result) => result.item);

  return (searchIndex.data ?? [])
   .filter(
    (item) =>
     item.kind === "navigation" &&
     (!item.lessonId || item.lessonId === lessonId || item.courseId === courseId),
   )
   .slice(0, 12);
 }, [courseId, deferredQuery, lessonId, results, searchIndex.data]);
 const safeSelectedIndex = Math.min(selectedIndex, Math.max(visibleItems.length - 1, 0));
 const trimmedQuery = query.trim();
 const canLookupDirectly = containsChinese(trimmedQuery);

 const handleQueryChange = (nextQuery: string) => {
  setSelectedIndex(0);
  onQueryChange(nextQuery);
 };

 const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "ArrowDown") {
   event.preventDefault();
   setSelectedIndex((current) =>
    visibleItems.length === 0 ? 0 : (current + 1) % visibleItems.length,
   );
  }

  if (event.key === "ArrowUp") {
   event.preventDefault();
   setSelectedIndex((current) =>
    visibleItems.length === 0 ? 0 : (current - 1 + visibleItems.length) % visibleItems.length,
   );
  }

  if (event.key === "Enter") {
   event.preventDefault();
   const selectedItem = visibleItems[safeSelectedIndex];
   if (selectedItem) onOpenResult(selectedItem);
   else if (canLookupDirectly) onDirectLookup(trimmedQuery);
  }
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent
    size="command"
    placement="top"
    className="h-[min(42rem,calc(100dvh-5rem))]"
    aria-describedby="hanzihome-search-description"
   >
    <DialogHeader className="sr-only">
     <DialogTitle>Tìm toàn bộ HanziHome</DialogTitle>
     <DialogDescription id="hanzihome-search-description">
      Tìm bài học, từ vựng, ngữ pháp, bài tập, bộ thủ và trang chức năng.
     </DialogDescription>
    </DialogHeader>

    <div className="relative border-b border-border-default">
     <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
     <Input
      autoFocus
      value={query}
      onChange={(event) => handleQueryChange(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Tìm Hán tự, pinyin, nghĩa, ngữ pháp, bài học..."
      aria-label="Tìm toàn bộ HanziHome"
      density="comfortable"
      surface="transparent"
      adornment="both"
      className="w-full"
     />
     {searchIndex.isFetching && (
      <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-text-muted" />
     )}
    </div>

    <div
     className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-2 py-2 scrollbar-soft"
     role="listbox"
    >
     {canLookupDirectly && (
      <Button
       type="button"
       onClick={() => onDirectLookup(trimmedQuery)}
       variant="ghost"
       align="start"
       className="mb-1 flex w-full"
      >
       <IconTile tone="accent" size="sm">
        <BookOpenCheck />
       </IconTile>
       <span className="min-w-0">
        <StudyInstructionText tone="default" weight="bold" className="block">
         Tra từ “{trimmedQuery}”
        </StudyInstructionText>
        <StudyInstructionText variant="bodySmall" tone="muted" weight="medium" className="block">
         Mở bảng phân tích chữ và từ điển nhanh
        </StudyInstructionText>
       </span>
      </Button>
     )}

     {visibleItems.map((item, index) => (
      <SearchResultItem
       key={item.id}
       item={item}
       selected={index === safeSelectedIndex}
       onSelect={() => setSelectedIndex(index)}
       onOpen={() => onOpenResult(item)}
      />
     ))}

     {!searchIndex.isLoading && trimmedQuery && visibleItems.length === 0 && (
      <div className="grid gap-1 px-4 py-10 text-center">
       <StudyInstructionText tone="default" weight="bold">
        Không tìm thấy nội dung phù hợp.
       </StudyInstructionText>
       <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
        Thử Hán tự, pinyin không dấu, nghĩa tiếng Việt hoặc tên bài.
       </StudyInstructionText>
      </div>
     )}
    </div>
   </DialogContent>
  </Dialog>
 );
}
