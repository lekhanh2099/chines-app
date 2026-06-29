"use client";

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
    className="top-[max(4rem,8vh)] flex h-[min(42rem,calc(100dvh-5rem))] max-w-3xl -translate-y-0 flex-col gap-0 overflow-hidden p-0"
    aria-describedby="hanzihome-search-description"
   >
    <DialogHeader className="sr-only">
     <DialogTitle>Tìm toàn bộ HanziHome</DialogTitle>
     <DialogDescription id="hanzihome-search-description">
      Tìm bài học, từ vựng, ngữ pháp, bài tập, bộ thủ và trang chức năng.
     </DialogDescription>
    </DialogHeader>

    <div className="relative border-b border-border-default">
     <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
     <input
      autoFocus
      value={query}
      onChange={(event) => handleQueryChange(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Tìm Hán tự, pinyin, nghĩa, ngữ pháp, bài học..."
      aria-label="Tìm toàn bộ HanziHome"
      className="h-14 w-full bg-transparent pl-12 pr-12 text-base font-semibold text-text-primary outline-none placeholder:font-medium placeholder:text-text-muted"
     />
     {searchIndex.isFetching && (
      <LoaderCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />
     )}
    </div>

    <div
     className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-2 py-2 scrollbar-soft"
     role="listbox"
    >
     {canLookupDirectly && (
      <button
       type="button"
       onClick={() => onDirectLookup(trimmedQuery)}
       className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-bg-subtle"
      >
       <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
        <BookOpenCheck className="h-4 w-4" />
       </span>
       <span>
        <span className="block font-bold text-text-primary">Tra từ “{trimmedQuery}”</span>
        <span className="block text-sm font-medium text-text-muted">
         Mở bảng phân tích chữ và từ điển nhanh
        </span>
       </span>
      </button>
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
      <div className="px-4 py-10 text-center grid gap-1">
       <p className="font-bold text-text-primary">Không tìm thấy nội dung phù hợp.</p>
       <p className="text-sm font-medium text-text-muted">
        Thử Hán tự, pinyin không dấu, nghĩa tiếng Việt hoặc tên bài.
       </p>
      </div>
     )}

     {searchIndex.isError && (
      <div className="px-4 py-10 text-center grid gap-1">
       <p className="font-bold text-danger">Không tải được chỉ mục tìm kiếm.</p>
       <p className="text-sm font-medium text-text-muted">Đóng và mở lại để thử lại.</p>
      </div>
     )}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default bg-bg-subtle px-4 py-2 text-xs font-semibold text-text-muted">
     <span>{trimmedQuery ? `${visibleItems.length} kết quả` : "Tìm trong toàn bộ HanziHome"}</span>
     <span>↑↓ chọn · Enter mở · Esc đóng · ⌘K</span>
    </div>
   </DialogContent>
  </Dialog>
 );
}
