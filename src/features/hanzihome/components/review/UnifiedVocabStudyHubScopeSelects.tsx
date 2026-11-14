"use client";

import { RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
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

/**
 * Picker for any single lesson, grouped by course/book (HanziHome catalog first,
 * then library textbooks). Nothing is selected until the learner picks a lesson.
 */
export function AnyLessonScopeSelect({ anyLesson }: { anyLesson: VocabStudyHubDeck["anyLesson"] }) {
 const t = useTranslations("BusinessChinese.vocabHub.anyLesson");
 const hasOptions = anyLesson.groups.length > 0;

 return (
  <div className="flex min-w-0 flex-wrap items-center gap-2">
   {hasOptions ? (
    <Select value={anyLesson.selection} onValueChange={anyLesson.setSelection}>
     <SelectTrigger
      size="compact"
      aria-label={t("selectLabel")}
      className="w-full max-w-72 min-w-0"
     >
      <SelectValue placeholder={t("placeholder")}>
       {anyLesson.selectedLabel || t("placeholder")}
      </SelectValue>
     </SelectTrigger>
     <SelectContent align="start">
      {anyLesson.groups.map((group, index) => (
       <div key={group.key}>
        {index > 0 ? <SelectSeparator /> : null}
        <SelectGroup>
         <SelectLabel>{group.label}</SelectLabel>
         {group.lessons.map((lesson) => (
          <SelectItem key={lesson.value} value={lesson.value}>
           {lesson.label}
          </SelectItem>
         ))}
        </SelectGroup>
       </div>
      ))}
     </SelectContent>
    </Select>
   ) : (
    <Typography variant="caption" tone="muted" clamp="one">
     {anyLesson.isSummaryLoading ? t("summariesLoading") : t("summariesError")}
    </Typography>
   )}
   {hasOptions && anyLesson.isSummaryError ? (
    <Typography variant="caption" tone="muted" clamp="one">
     {t("summariesError")}
    </Typography>
   ) : null}
   {anyLesson.canRetry ? (
    <Button type="button" size="compact" variant="outline" onClick={anyLesson.retry}>
     <RotateCw className="size-3.5" />
     <span>{t("retry")}</span>
    </Button>
   ) : null}
  </div>
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
