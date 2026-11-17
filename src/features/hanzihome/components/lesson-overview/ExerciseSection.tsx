import type {
 Exercise,
 ReadingItem,
 Section,
} from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { ExerciseBody } from "./exercise-section/ExerciseBody";
import { RawExerciseDataDetails } from "./exercise-section/RawExerciseDataDetails";
import type { LessonDisplayMode } from "./types";
import { asRecord, stringValue } from "./utils";
import { ReaderHanziText, StudyInstructionText } from "./hanzi-typography";

const EXERCISE_PAGE_METADATA_PATTERN = /^Trang bài tập\s+\d+$/i;

function meaningfulVietnameseTitle(value: Exercise["title_vi"]) {
 const title = value?.trim();
 return title && !EXERCISE_PAGE_METADATA_PATTERN.test(title) ? title : "";
}

export function ExerciseCard({
 item,
 displayMode,
 debugMode = false,
 readingItems,
 readingSections,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
 debugMode?: boolean;
 readingItems?: readonly ReadingItem[];
 readingSections?: readonly Section[];
}) {
 const record = asRecord(item);
 const instruction = asRecord(record.instruction);
 const title = item.title || meaningfulVietnameseTitle(item.title_vi) || `Bài tập ${item.order}`;
 const titleVi = meaningfulVietnameseTitle(item.title_vi);
 const rawInstruction =
  meaningfulVietnameseTitle(stringValue(instruction, "vi")) || stringValue(instruction, "zh");
 const instructionText = rawInstruction !== title ? rawInstruction : "";

 return (
  <article className="exercise-card-surface grid gap-4 rounded-xl border p-4 shadow-theme-sm sm:p-5">
   <div className="flex items-start justify-between gap-3">
    <StudyInstructionText
     variant="label"
     weight="black"
     className="study-chip-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
    >
     {item.order}
    </StudyInstructionText>
    <div className="grid gap-1 min-w-0 flex-1">
     <ReaderHanziText as="h4" displayMode={displayMode} size="md" weight="black" leading="tight">
      {title}
     </ReaderHanziText>
     {displayMode.showMeaning && titleVi && titleVi !== title ? (
      <StudyInstructionText variant="bodySmall" tone="muted" weight="semibold" leading="standard">
       {titleVi}
      </StudyInstructionText>
     ) : null}
     {instructionText && (
      <StudyInstructionText
       variant="bodySmall"
       tone="secondary"
       weight="semibold"
       leading="standard"
      >
       {instructionText}
      </StudyInstructionText>
     )}
    </div>
   </div>

   <ExerciseBody
    item={item}
    displayMode={displayMode}
    readingItems={readingItems}
    readingSections={readingSections}
   />

   {debugMode && <RawExerciseDataDetails value={item} />}
  </article>
 );
}
