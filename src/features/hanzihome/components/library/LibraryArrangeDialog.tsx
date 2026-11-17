"use client";

import type { ComponentProps } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/overlays/dialog";
import type { LibraryCourseGroup } from "@/features/hanzihome/components/library/library-course-groups";
import { RecentLearningCard } from "@/features/hanzihome/components/library/RecentLearningCard";
import { HanziInlineText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/textbook-catalog";

type RecentLearningCardProps = ComponentProps<typeof RecentLearningCard>;

export function LibraryArrangeDialog({
 visibleCollectionIds,
 visibleGroups,
 visibleTextbooks,
 canReorder,
 isCoarsePointer,
 courses,
 books,
 lessons,
 textbooks,
 onMoveCollection,
}: {
 visibleCollectionIds: string[];
 visibleGroups: LibraryCourseGroup[];
 visibleTextbooks: TextbookBookSummary[];
 canReorder: boolean;
 isCoarsePointer: boolean;
 courses: RecentLearningCardProps["courses"];
 books: RecentLearningCardProps["books"];
 lessons: RecentLearningCardProps["lessons"];
 textbooks: RecentLearningCardProps["textbooks"];
 onMoveCollection: (sourceId: string, targetId: string) => void;
}) {
 const t = useTranslations("Common.library");
 const common = useTranslations("Common");

 return (
  <Dialog>
   <DialogTrigger asChild>
    <Button variant="outline" size="toolbar" className="sm:ml-auto">
     <ArrowUpDown data-icon="inline-start" />
     {t("arrange")}
    </Button>
   </DialogTrigger>
   <DialogContent size="lg" closeLabel={common("actions.close")}>
    <DialogHeader>
     <DialogTitle>{t("arrange")}</DialogTitle>
     <DialogDescription>{t("arrangeDescription")}</DialogDescription>
    </DialogHeader>
    <DialogBody className="grid gap-5">
     <div className="grid gap-2">
      {visibleCollectionIds.map((id, index) => {
       const group = visibleGroups.find((item) => id === `group:${item.key}`);
       const book = visibleTextbooks.find((item) => id === `static:${item.id}`);
       const title = group ? t(`groups.${group.key}.title`) : book?.label;
       if (!title) return null;
       return (
        <div key={id} className="flex min-w-0 items-center gap-2">
         <Typography variant="bodySmall" className="min-w-0 flex-1" wrapping="breakWords">
          <HanziInlineText text={title} />
         </Typography>
         <Button
          variant="ghost"
          size={isCoarsePointer ? "icon" : "icon-toolbar"}
          aria-label={`${t("moveEarlier")}: ${title}`}
          disabled={!canReorder || index === 0}
          onClick={() => {
           const previousId = visibleCollectionIds[index - 1];
           if (previousId) onMoveCollection(id, previousId);
          }}
         >
          <ArrowUp />
         </Button>
         <Button
          variant="ghost"
          size={isCoarsePointer ? "icon" : "icon-toolbar"}
          aria-label={`${t("moveLater")}: ${title}`}
          disabled={!canReorder || index === visibleCollectionIds.length - 1}
          onClick={() => {
           const nextId = visibleCollectionIds[index + 1];
           if (nextId) onMoveCollection(id, nextId);
          }}
         >
          <ArrowDown />
         </Button>
        </div>
       );
      })}
     </div>
     <RecentLearningCard courses={courses} books={books} lessons={lessons} textbooks={textbooks} />
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
