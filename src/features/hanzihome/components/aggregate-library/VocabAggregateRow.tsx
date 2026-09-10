import Link from "next/link";

import { ActionCard } from "@/components/ui/action-card";
import { Badge } from "@/components/ui/badge";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import type { AggregateVocabItem } from "./aggregate-utils";

export function VocabAggregateRow({ item }: { item: AggregateVocabItem }) {
 return (
  <ActionCard
   padding="md"
   asChild
   className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
  >
   <Link
    href={buildHanziHomeLessonHref({
     courseId: item.courseId,
     bookId: item.bookId,
     lessonNumber: item.lessonNumber,
     module: "vocab",
    })}
   >
    <div className="min-w-0">
     <HanziText as="p" size="card" variant="pageTitle" tone="default" weight="black" leading="none">
      {item.word}
     </HanziText>
     <StudyInstructionText variant="caption" tone="muted" weight="black" clamp="one">
      {item.pinyin}
     </StudyInstructionText>
    </div>

    <StudyInstructionText tone="secondary" weight="bold" className="min-w-0">
     <StudyInstructionText as="span" tone="default" weight="black">
      {item.hanViet}
     </StudyInstructionText>
     <StudyInstructionText as="span" tone="muted">
      {" "}
      ·{" "}
     </StudyInstructionText>
     {item.meaning}
    </StudyInstructionText>

    <Badge size="sm">{item.category}</Badge>
   </Link>
  </ActionCard>
 );
}
