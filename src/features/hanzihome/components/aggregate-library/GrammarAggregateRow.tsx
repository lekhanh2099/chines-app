import Link from "next/link";

import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import type { AggregateGrammarItem } from "./aggregate-utils";

export function GrammarAggregateRow({ item }: { item: AggregateGrammarItem }) {
 return (
  <Link
   href={buildHanziHomeLessonHref({
    courseId: item.courseId,
    lessonNumber: item.lessonNumber,
    module: "grammar",
   })}
   prefetch={false}
   className="grid gap-1 rounded-xl border border-border-default bg-bg-subtle p-3 transition-colors hover:border-border-hover hover:bg-bg-elevated"
  >
   <h3 className="line-clamp-1 font-black text-text-primary sm:text-base">
    {item.cleanTitle || item.title}
   </h3>
   <p className="line-clamp-2  font-bold text-text-secondary">{item.core}</p>
  </Link>
 );
}
