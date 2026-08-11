import Link from "next/link";

import { ActionCard } from "@/components/ui/action-card";
import { Typography } from "@/components/ui/typography";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import type { AggregateGrammarItem } from "./aggregate-utils";

export function GrammarAggregateRow({ item }: { item: AggregateGrammarItem }) {
 return (
  <ActionCard padding="md" asChild className="grid gap-1">
   <Link
    href={buildHanziHomeLessonHref({
     courseId: item.courseId,
     bookId: item.bookId,
     lessonNumber: item.lessonNumber,
     module: "grammar",
    })}
    prefetch={false}
   >
    <Typography as="h3" variant="cardTitle" tone="default" weight="black" clamp="one">
     {item.cleanTitle || item.title}
    </Typography>
    <StudyInstructionText tone="secondary" weight="bold" clamp="two">
     {item.core}
    </StudyInstructionText>
   </Link>
  </ActionCard>
 );
}
