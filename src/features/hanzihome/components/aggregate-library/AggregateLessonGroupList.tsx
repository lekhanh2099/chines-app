"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { GrammarAggregateRow } from "@/features/hanzihome/components/aggregate-library/GrammarAggregateRow";
import { VocabAggregateRow } from "@/features/hanzihome/components/aggregate-library/VocabAggregateRow";
import {
 formatLessonHeading,
 isAggregateVocabItem,
 type groupByLesson,
} from "@/features/hanzihome/components/aggregate-library/aggregate-utils";
import type { AggregateKind } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import { buildVocabReviewHrefFromLessons } from "@/features/hanzihome/utils/review-selection-route";
import { prefetchHanziHomeLessonResources } from "@/features/hanzihome/utils/lesson-prefetch";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";

export function AggregateLessonGroupList({
 kind,
 groups,
 onStartReview,
}: {
 kind: AggregateKind;
 groups: ReturnType<typeof groupByLesson>;
 onStartReview: (lessonIds: string[]) => void;
}) {
 const t = useTranslations("Vocab");
 const queryClient = useQueryClient();

 return (
  <Card variant="section" padding="md" className="grid gap-4">
   {groups.map((group, groupIndex) => (
    <section key={group.lessonId} className="grid gap-3">
     {groupIndex > 0 ? <Separator /> : null}
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
       <Typography as="h2" variant="sectionTitle" weight="black">
        {formatLessonHeading(group.lessonNumber, group.lessonTitle, (number, title) =>
         t("filters.lessonOption", { number, title }),
        )}
       </Typography>
       <Typography variant="caption" tone="muted" weight="bold">
        {t("list.count", { count: group.items.length })}
       </Typography>
      </div>

      <div className="flex flex-wrap gap-1.5">
       <Button asChild variant="outline" size="toolbar">
        <Link
         href={buildHanziHomeLessonHref({
          courseId: group.courseId,
          bookId: group.bookId,
          lessonNumber: group.lessonNumber,
          module: kind === "vocab" ? "vocab" : "grammar",
         })}
         onMouseEnter={() => prefetchHanziHomeLessonResources(queryClient, group.lessonId)}
         onFocus={() => prefetchHanziHomeLessonResources(queryClient, group.lessonId)}
         onTouchStart={() => prefetchHanziHomeLessonResources(queryClient, group.lessonId)}
        >
         {t("list.openLesson")}
        </Link>
       </Button>
       {kind === "vocab" ? (
        <Button asChild variant="outline" size="toolbar">
         <Link
          href={buildVocabReviewHrefFromLessons([
           {
            id: group.lessonId,
            lessonNumber: group.lessonNumber,
            courseId: group.courseId,
            title: group.lessonTitle,
            titleZh: group.lessonTitle,
           },
          ])}
          onMouseEnter={() => prefetchHanziHomeLessonResources(queryClient, group.lessonId)}
          onFocus={() => prefetchHanziHomeLessonResources(queryClient, group.lessonId)}
          onTouchStart={() => prefetchHanziHomeLessonResources(queryClient, group.lessonId)}
         >
          {t("list.reviewLesson")}
         </Link>
        </Button>
       ) : (
        <Button
         type="button"
         variant="outline"
         size="toolbar"
         onClick={() => onStartReview([group.lessonId])}
        >
         {t("list.reviewLesson")}
        </Button>
       )}
      </div>
     </div>

     <div className="grid gap-2">
      {group.items.map((item) => {
       if (isAggregateVocabItem(item)) {
        return <VocabAggregateRow key={item.id} item={item} />;
       }

       return <GrammarAggregateRow key={item.id} item={item} />;
      })}
     </div>
    </section>
   ))}
  </Card>
 );
}
