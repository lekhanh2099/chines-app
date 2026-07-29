import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";

import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import type { AggregateGrammarItem } from "./aggregate-utils";

export function GrammarAggregateRow({ item }: { item: AggregateGrammarItem }) {
 return (
  <Link
   href={buildHanziHomeLessonHref({
    courseId: item.courseId,
    bookId: item.bookId,
    lessonNumber: item.lessonNumber,
    module: "grammar",
   })}
   prefetch={false}
   className="grid gap-1 rounded-xl border border-border-default bg-bg-subtle p-3 transition-colors hover:border-border-hover hover:bg-bg-elevated"
  >
   <Typography as="h3" variant="cardTitle" tone="default" weight="black" clamp="one">
    {item.cleanTitle || item.title}
   </Typography>
   <StudyInstructionText tone="secondary" weight="bold" clamp="two">
    {item.core}
   </StudyInstructionText>
  </Link>
 );
}
