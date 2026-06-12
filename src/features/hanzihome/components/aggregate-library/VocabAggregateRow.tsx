import Link from "next/link";

import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import type { AggregateVocabItem } from "./aggregate-utils";

export function VocabAggregateRow({ item }: { item: AggregateVocabItem }) {
 return (
  <Link
   href={buildHanziHomeLessonHref({
    courseId: item.courseId,
    lessonNumber: item.lessonNumber,
    module: "vocab",
   })}
   className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3 transition-colors hover:border-border-hover hover:bg-bg-elevated sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
  >
   <div className="min-w-0">
    <p className="font-hanzi text-2xl font-black leading-none text-text-primary">{item.word}</p>
    <p className="truncate text-xs font-black text-text-muted">{item.pinyin}</p>
   </div>

   <p className="min-w-0  font-bold text-text-secondary">
    <span className="font-black text-text-primary">{item.hanViet}</span>
    <span className="text-text-muted"> · </span>
    {item.meaning}
   </p>

   <span className="w-fit rounded-full bg-bg-card px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-wide text-text-muted">
    {item.category}
   </span>
  </Link>
 );
}
