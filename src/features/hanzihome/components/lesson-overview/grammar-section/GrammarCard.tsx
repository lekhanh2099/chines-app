import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/display/typography";
import type { GrammarPoint } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import type { LessonDisplayMode } from "../types";
import { GrammarBlockView } from "./GrammarBlockView";

export function GrammarCard({
 lessonId,
 item,
 displayMode,
}: {
 lessonId?: string;
 item: GrammarPoint;
 displayMode: LessonDisplayMode;
}) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-4">
   <div>
    <Typography as="h4" variant="cardTitle" tone="default" weight="black">
     {item.title_vi || item.title}
    </Typography>
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="bold"
     tracking="wide"
     transform="uppercase"
    >
     {item.title}
    </StudyInstructionText>
   </div>
   <div className="grid gap-2">
    {item.blocks.map((block) => (
     <GrammarBlockView key={block.id} lessonId={lessonId} block={block} displayMode={displayMode} />
    ))}
   </div>
  </article>
 );
}
