"use client";

import { Typography } from "@/components/ui/display/typography";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectLabel,
 SelectSeparator,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import type { useVocabStudyHubDeck } from "./useVocabStudyHubDeck";
import { IT_PRESET_ITEMS } from "./vocab-hub-model";

type VocabStudyHubDeck = ReturnType<typeof useVocabStudyHubDeck>;

/** Scope selector for bookmarked textbook lessons: all, whole book, or one lesson. */
export function BookmarkedLessonScopeSelect({
 bookmarkedGroups,
 bookmarkedSelection,
 setBookmarkedSelection,
 bookmarkedSelectionLabel,
 totalBookmarkedLessons,
 allBookmarkedVocabCount,
}: {
 bookmarkedGroups: VocabStudyHubDeck["bookmarkedGroups"];
 bookmarkedSelection: VocabStudyHubDeck["bookmarkedSelection"];
 setBookmarkedSelection: VocabStudyHubDeck["setBookmarkedSelection"];
 bookmarkedSelectionLabel: string;
 totalBookmarkedLessons: VocabStudyHubDeck["totalBookmarkedLessons"];
 allBookmarkedVocabCount: VocabStudyHubDeck["allBookmarkedVocabCount"];
}) {
 return bookmarkedGroups.length > 0 ? (
  <Select value={bookmarkedSelection} onValueChange={setBookmarkedSelection}>
   <SelectTrigger
    size="compact"
    aria-label="Chọn bài học đã đánh dấu"
    className="w-full max-w-72 min-w-0"
   >
    <SelectValue placeholder={bookmarkedSelectionLabel}>{bookmarkedSelectionLabel}</SelectValue>
   </SelectTrigger>
   <SelectContent align="start">
    <SelectGroup>
     <SelectItem value="all">
      {`Ôn tất cả (${totalBookmarkedLessons} bài · ${allBookmarkedVocabCount} từ)`}
     </SelectItem>
    </SelectGroup>

    {bookmarkedGroups.length > 1 ? (
     <>
      <SelectSeparator />
      <SelectGroup>
       <SelectLabel>Theo giáo trình đã đánh dấu</SelectLabel>
       {bookmarkedGroups.map((group) => (
        <SelectItem key={`book:${group.bookKey}`} value={`book:${group.bookKey}`}>
         {`Cả bộ: ${group.bookLabel} (${group.lessons.length} bài · ${group.totalVocabCount} từ)`}
        </SelectItem>
       ))}
      </SelectGroup>
     </>
    ) : null}

    {bookmarkedGroups.map((group) => (
     <div key={group.bookKey}>
      <SelectSeparator />
      <SelectGroup>
       <SelectLabel>{group.bookLabel}</SelectLabel>
       {group.lessons.map((lesson) => (
        <SelectItem key={lesson.id} value={`lesson:${lesson.id}`}>
         {`${lesson.title} (${lesson.vocabCount} từ)`}
        </SelectItem>
       ))}
      </SelectGroup>
     </div>
    ))}
   </SelectContent>
  </Select>
 ) : (
  <Typography variant="caption" tone="muted" clamp="one">
   Chưa có bài đã mark trong giáo trình
  </Typography>
 );
}

/** Scope selector for the IT corpus: quick-study presets or a single topic group. */
export function ItVocabScopeSelect({
 itCorpus,
 itSelection,
 setItSelection,
}: {
 itCorpus: VocabStudyHubDeck["itCorpus"];
 itSelection: VocabStudyHubDeck["itSelection"];
 setItSelection: VocabStudyHubDeck["setItSelection"];
}) {
 return (
  <Select value={itSelection} onValueChange={setItSelection}>
   <SelectTrigger
    size="compact"
    aria-label="Chọn nhóm từ vựng IT"
    className="w-full max-w-72 min-w-0"
   >
    <SelectValue />
   </SelectTrigger>
   <SelectContent align="start">
    <SelectGroup>
     <SelectLabel>Lộ trình học nhanh</SelectLabel>
     {IT_PRESET_ITEMS.map((preset) => (
      <SelectItem key={preset.key} value={`preset:${preset.key}`}>
       {preset.label}
      </SelectItem>
     ))}
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
     <SelectLabel>Chọn riêng từng nhóm chuyên đề</SelectLabel>
     {itCorpus.groups.map((group) => (
      <SelectItem key={group.id} value={`group:${group.id}`}>
       {`${group.label} (${group.items.length} từ)`}
      </SelectItem>
     ))}
    </SelectGroup>
   </SelectContent>
  </Select>
 );
}
