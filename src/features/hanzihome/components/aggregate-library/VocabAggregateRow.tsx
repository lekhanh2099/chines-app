import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import Link from "next/link";

import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import type { AggregateVocabItem } from "./aggregate-utils";

export function VocabAggregateRow({ item }: { item: AggregateVocabItem }) {
 return (
  <Link
   href={buildHanziHomeLessonHref({
    courseId: item.courseId,
    bookId: item.bookId,
    lessonNumber: item.lessonNumber,
    module: "vocab",
   })}
   prefetch={false}
   className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3 transition-colors hover:border-border-hover hover:bg-bg-elevated sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
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

   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    scale="fine"
    transform="uppercase"
    className="w-fit rounded-full bg-bg-card px-2.5 py-1"
   >
    {item.category}
   </StudyInstructionText>
  </Link>
 );
}
