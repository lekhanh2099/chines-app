import type { NoteItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import {
 AdaptiveStudyText,
 containsHanziText,
 ReaderHanziText,
 StudyInstructionText,
} from "./hanzi-typography";

export function NoteCard({
 item,
 displayMode,
 lessonId,
}: {
 item: NoteItem;
 displayMode: LessonDisplayMode;
 lessonId?: string;
}) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div className="grid gap-1">
    {containsHanziText(item.title) ? (
     <ReaderHanziText as="h4" displayMode={displayMode} size="md" weight="black" leading="tight">
      {item.title}
     </ReaderHanziText>
    ) : (
     <StudyInstructionText as="h4" variant="cardTitle">
      {item.title}
     </StudyInstructionText>
    )}
    {item.structure && (
     <AdaptiveStudyText
      text={item.structure}
      displayMode={displayMode}
      tone="accent"
      weight="black"
      leading="learner"
      className="rounded-lg bg-accent-subtle px-3 py-2"
     />
    )}
   </div>
   {displayMode.showMeaning && (
    <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
     {item.meaning_vi}
    </StudyInstructionText>
   )}
   {item.examples.length > 0 && (
    <div className="grid gap-2">
     {item.examples.map((example) => (
      <TextLineCard
       key={example.id}
       zh={example.zh}
       pinyin={example.pinyin}
       vi={example.vi}
       displayMode={displayMode}
       annotationTarget={
        lessonId ? { lessonId, nodeType: "note_example", nodeId: example.id } : undefined
       }
      />
     ))}
    </div>
   )}
  </article>
 );
}
